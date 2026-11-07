import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Post } from './scanner'
import { transformObsidianSyntax } from './obsidian-transform'

export interface SiteConfig {
    title: string
    base: string
    description: string
    hostname?: string
    theme: string
}

const DEFAULT_CONFIG: SiteConfig = {
    title: 'My Blog',
    base: '/',
    description: 'A blog powered by nblog',
    theme: 'notion',
}

const PLACEHOLDER_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
)

/**
 * 一篇文章的图片资源映射。
 * 源目录可能嵌套，输出统一平铺到 public/images/，文件名带文章 slug 前缀。
 */
interface AssetMap {
    /** 源相对路径 / basename -> 输出文件名 */
    byKey: Map<string, string>
    /** 输出文件名 -> 源文件绝对路径 */
    files: Map<string, string>
    /** 输出文件名 -> 原始引用名（用于警告） */
    missing: Map<string, string>
    /** 已使用的输出文件名（小写） */
    used: Set<string>
}

/**
 * 准备构建目录：复制模板、写入数据、生成文章页面
 */
export function prepareBuildDir(
    posts: Post[],
    templateDir: string,
    userConfig: Partial<SiteConfig>,
    buildDirPath?: string
): string {
    // 过滤掉 undefined 值，避免覆盖默认值
    const filteredConfig = Object.fromEntries(
        Object.entries(userConfig).filter(([_, v]) => v !== undefined)
    )
    const config = { ...DEFAULT_CONFIG, ...filteredConfig }
    // 默认放在包目录下，保证生成的 .vitepress/config.ts 能解析到 vitepress
    const buildDir = buildDirPath ? path.resolve(buildDirPath) : path.resolve('.nblog-build')

    // 清理并创建构建目录
    if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true })
    }
    fs.mkdirSync(buildDir, { recursive: true })

    // 复制模板目录
    copyDir(templateDir, buildDir)

    // 临时构建目录没有 package.json，显式标记为 ESM。
    // 否则 Vite 会按 CJS 加载 .vitepress/config.ts，require 只支持 ESM 的 vitepress。
    const buildPackageJson = path.join(buildDir, 'package.json')
    if (!fs.existsSync(buildPackageJson)) {
        fs.writeFileSync(
            buildPackageJson,
            JSON.stringify({ type: 'module', private: true }, null, 2) + '\n',
            'utf-8'
        )
    }

    // 写入 posts 数据（给 themeConfig.posts）
    const postsData = posts.map(p => ({
        frontMatter: p.frontMatter,
        regularPath: p.regularPath,
    }))
    fs.writeFileSync(
        path.join(buildDir, '.vitepress', 'posts-data.json'),
        JSON.stringify(postsData, null, 2),
        'utf-8'
    )

    // 写入文章页面
    const postsDir = path.join(buildDir, 'posts')
    fs.mkdirSync(postsDir, { recursive: true })

    // 图片输出目录（VitePress public 目录）
    const imagesDir = path.join(buildDir, 'public', 'images')
    fs.mkdirSync(imagesDir, { recursive: true })

    // wikilink 解析：文件名 / 标题 / slug -> 文章 slug
    const linkMap = buildLinkMap(posts)

    let copiedImages = 0
    let placeholderCount = 0
    const generatedPosts: GeneratedPost[] = []

    for (const post of posts) {
        const assets = buildAssetMap(post)
        const content = transformPostContent(post, assets, linkMap)
        fs.writeFileSync(
            path.join(postsDir, `${post.slug}.md`),
            renderPostMarkdown(post, content),
            'utf-8'
        )
        generatedPosts.push({ post, content })
        copiedImages += copyPostAssets(assets, imagesDir)
        placeholderCount += createPlaceholderImages(assets, imagesDir)
    }

    if (copiedImages > 0) {
        console.log(`    📷 Copied ${copiedImages} images`)
    }
    if (placeholderCount > 0) {
        console.log(`    🖼 Created ${placeholderCount} placeholder images`)
    }

    // 写入站点配置
    writeSiteConfig(buildDir, config)

    // 生成 llms.txt / llms-full.txt，供大模型抓取
    writeLlmsFiles(buildDir, generatedPosts, config)

    return buildDir
}

interface GeneratedPost {
    post: Post
    /** 已转换 Obsidian 语法的正文（不含 frontmatter） */
    content: string
}

/**
 * 转换单篇文章的 Obsidian 语法
 */
function transformPostContent(
    post: Post,
    assets: AssetMap,
    linkMap: Map<string, string>
): string {
    return transformObsidianSyntax(post.content, {
        resolveImage: (filename) => resolveAssetName(assets, post.slug, filename),
        resolvePostLink: (target) => linkMap.get(target.trim().toLowerCase()),
    })
}

/**
 * 生成单篇文章的 Markdown 文件
 */
function renderPostMarkdown(post: Post, content: string): string {
    const frontmatter = [
        '---',
        `title: ${yamlString(post.frontMatter.title)}`,
        `published: ${yamlString(post.frontMatter.published)}`,
    ]

    if (post.frontMatter.created) {
        frontmatter.push(`created: ${yamlString(post.frontMatter.created)}`)
    }
    if (post.frontMatter.updated) {
        frontmatter.push(`updated: ${yamlString(post.frontMatter.updated)}`)
    }

    if (post.frontMatter.tags.length > 0) {
        frontmatter.push('tags:')
        for (const tag of post.frontMatter.tags) {
            frontmatter.push(`  - ${yamlString(tag)}`)
        }
    }

    if (post.frontMatter.category) {
        frontmatter.push(`category: ${yamlString(post.frontMatter.category)}`)
    }

    if (post.frontMatter.description) {
        frontmatter.push(`description: ${yamlString(post.frontMatter.description)}`)
    }

    frontmatter.push('---')
    frontmatter.push('')

    return frontmatter.join('\n') + '\n' + content
}

/**
 * 写入站点配置
 */
function writeSiteConfig(buildDir: string, config: SiteConfig): void {
    const configPath = path.join(buildDir, '.vitepress', 'config.ts')
    let configContent = fs.readFileSync(configPath, 'utf-8')

    // 替换默认值
    configContent = configContent.replace(
        "title: 'My Blog'",
        `title: '${escapeSingleQuote(config.title)}'`
    )
    configContent = configContent.replace(
        "description: 'A blog powered by nblog'",
        `description: '${escapeSingleQuote(config.description)}'`
    )
    configContent = configContent.replace(
        "base: '/'",
        `base: '${escapeSingleQuote(config.base)}'`
    )

    // 替换默认主题
    configContent = configContent.replaceAll(
        '__DEFAULT_THEME__',
        escapeSingleQuote(config.theme)
    )

    // 如果有 hostname，添加 sitemap
    if (config.hostname) {
        const sitemapConfig = `\n    sitemap: {\n        hostname: '${config.hostname}',\n        lastmodDateOnly: false\n    },`
        configContent = configContent.replace(
            /(\s+)(themeConfig:)/,
            `$1${sitemapConfig}$1$2`
        )
    }

    fs.writeFileSync(configPath, configContent, 'utf-8')
}

/**
 * 生成 llms.txt 和 llms-full.txt，写入 public/，
 * VitePress 构建时会原样复制到 dist 根目录。
 *
 * llms.txt 遵循 https://llmstxt.org/ 约定：
 * H1 站点名 + 引用块简介 + H2 分组的链接列表。
 */
function writeLlmsFiles(
    buildDir: string,
    posts: GeneratedPost[],
    config: SiteConfig
): void {
    if (posts.length === 0) return

    const publicDir = path.join(buildDir, 'public')
    fs.mkdirSync(publicDir, { recursive: true })

    fs.writeFileSync(
        path.join(publicDir, 'llms.txt'),
        generateLlmsTxt(posts, config),
        'utf-8'
    )
    fs.writeFileSync(
        path.join(publicDir, 'llms-full.txt'),
        generateLlmsFullTxt(posts, config),
        'utf-8'
    )
}

/**
 * llms.txt：站点索引，按分类列出所有已发布文章
 */
function generateLlmsTxt(posts: GeneratedPost[], config: SiteConfig): string {
    const lines: string[] = []

    lines.push(`# ${oneLine(config.title) || 'Blog'}`, '')
    lines.push(`> ${oneLine(config.description) || 'A blog powered by nblog'}`, '')
    lines.push(
        `This site contains ${posts.length} published post${posts.length === 1 ? '' : 's'}.`,
        ''
    )

    // VitePress 默认 cleanUrls: false，静态文件带 .html 后缀
    lines.push('## Pages', '')
    lines.push(`- [Home](${siteUrl(config, '')}): Latest posts`)
    lines.push(`- [Archives](${siteUrl(config, 'pages/archives.html')}): Posts grouped by date`)
    lines.push(`- [Categories](${siteUrl(config, 'pages/category.html')}): Posts grouped by category`)
    lines.push(`- [Tags](${siteUrl(config, 'pages/tags.html')}): Posts grouped by tag`)
    lines.push('')

    for (const [heading, items] of groupPostsByCategory(posts)) {
        lines.push(`## ${heading}`, '')
        for (const { post } of items) {
            const fm = post.frontMatter
            const description = fm.description ? `: ${summarize(fm.description)}` : ''
            lines.push(
                `- [${escapeLinkText(fm.title)}](${postUrl(config, post)}) (${fm.published})${description}`
            )
        }
        lines.push('')
    }

    lines.push('## Optional', '')
    lines.push(
        `- [Full text](${siteUrl(config, 'llms-full.txt')}): All published posts in a single Markdown file`
    )

    return lines.join('\n') + '\n'
}

/**
 * llms-full.txt：所有文章的完整正文合并成一个文件
 */
function generateLlmsFullTxt(posts: GeneratedPost[], config: SiteConfig): string {
    const lines: string[] = []

    lines.push(`# ${oneLine(config.title) || 'Blog'}`, '')
    lines.push(`> ${oneLine(config.description) || 'A blog powered by nblog'}`, '')
    lines.push(
        `This file contains the full text of ${posts.length} published post${posts.length === 1 ? '' : 's'}.`,
        ''
    )

    for (const { post, content } of posts) {
        const fm = post.frontMatter
        lines.push(`## ${oneLine(fm.title)}`, '')
        lines.push(`- Published: ${fm.published}`)
        if (fm.category) lines.push(`- Category: ${oneLine(fm.category)}`)
        if (fm.tags.length > 0) {
            lines.push(`- Tags: ${fm.tags.map(oneLine).join(', ')}`)
        }
        lines.push(`- URL: ${postUrl(config, post)}`)
        lines.push('')
        lines.push(rewriteInternalLinks(content).trim(), '')
    }

    return lines.join('\n').trimEnd() + '\n'
}

/**
 * 按分类分组；没有分类的文章归入 Posts
 */
function groupPostsByCategory(posts: GeneratedPost[]): [string, GeneratedPost[]][] {
    const groups = new Map<string, GeneratedPost[]>()

    for (const item of posts) {
        const category = oneLine(item.post.frontMatter.category) || 'Posts'
        const group = groups.get(category)
        if (group) {
            group.push(item)
        } else {
            groups.set(category, [item])
        }
    }

    return [...groups.entries()]
}

/**
 * 部署根路径，始终带前后斜杠："/" 或 "/blog/"
 */
function normalizeBasePath(base: string): string {
    const trimmed = (base || '/').trim().replace(/^\/+|\/+$/g, '')
    return trimmed ? `/${trimmed}/` : '/'
}

/**
 * 生成站点内链接。配置了 hostname 时输出绝对地址，否则输出带 base 的站内路径。
 */
function siteUrl(config: SiteConfig, pathname: string): string {
    const path = `${normalizeBasePath(config.base)}${pathname.replace(/^\/+/, '')}`
    if (!config.hostname) return path
    return config.hostname.replace(/\/+$/, '') + path
}

function postUrl(config: SiteConfig, post: Post): string {
    return siteUrl(config, `posts/${encodeURIComponent(post.slug)}.html`)
}

/**
 * llms-full.txt 直接输出 Markdown 正文，不经过 VitePress 的链接处理，
 * 需要手动给站内文章链接补上 .html。
 */
function rewriteInternalLinks(content: string): string {
    return content.replace(/\(\/posts\/([^)\s#]+)\)/g, (match, path: string) => {
        return path.endsWith('.html') ? match : `(/posts/${path}.html)`
    })
}

function oneLine(value: string): string {
    return value.replace(/\s+/g, ' ').trim()
}

function summarize(value: string, max = 200): string {
    const text = oneLine(value)
    return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function escapeLinkText(value: string): string {
    return oneLine(value).replace(/[[\]]/g, '\\$&')
}

/**
 * JSON.stringify 生成的是合法的 YAML 双引号标量，能安全处理引号、换行、冒号
 */
function yamlString(value: string): string {
    return JSON.stringify(value)
}

function escapeSingleQuote(str: string): string {
    return str.replace(/'/g, "\\'")
}

/**
 * 建立 wikilink 解析表：文件名、标题、slug 都映射到最终 slug
 */
function buildLinkMap(posts: Post[]): Map<string, string> {
    const map = new Map<string, string>()

    const add = (key: string, slug: string) => {
        const normalized = key.trim().toLowerCase()
        if (normalized && !map.has(normalized)) {
            map.set(normalized, slug)
        }
    }

    for (const post of posts) {
        const fileName = path.basename(post.filePath).replace(/\.md$/i, '')
        add(fileName, post.slug)
        add(post.frontMatter.title, post.slug)
        add(post.slug, post.slug)
    }

    return map
}

/**
 * 递归列出资产目录中的所有文件，跳过隐藏文件
 */
function walkFiles(dir: string): string[] {
    const result: string[] = []

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            result.push(...walkFiles(fullPath))
        } else if (entry.isFile()) {
            result.push(fullPath)
        }
    }

    return result
}

/**
 * 构建一篇文章的图片映射。
 * 先处理浅层文件，保证 ![[pic.png]] 优先命中根目录的 pic.png。
 */
function buildAssetMap(post: Post): AssetMap {
    const map: AssetMap = {
        byKey: new Map(),
        files: new Map(),
        missing: new Map(),
        used: new Set(),
    }

    const assetsDir = post.filePath.replace(/\.md$/i, '.md_assets')
    if (!fs.existsSync(assetsDir)) return map

    const files = walkFiles(assetsDir).sort((a, b) => depth(a) - depth(b))

    for (const file of files) {
        const relative = path.relative(assetsDir, file).split(path.sep).join('/')
        const outputName = uniqueAssetName(post.slug, relative, map.used)

        map.byKey.set(relative, outputName)
        const baseName = relative.split('/').pop()!
        if (!map.byKey.has(baseName)) {
            map.byKey.set(baseName, outputName)
        }
        map.files.set(outputName, file)
    }

    return map
}

function depth(file: string): number {
    return file.split(path.sep).length
}

/**
 * 把图片引用解析成输出文件名；找不到源文件时登记为占位图
 */
function resolveAssetName(assets: AssetMap, postSlug: string, raw: string): string {
    const key = normalizeAssetKey(raw)
    const baseName = key.split('/').pop() || key
    const found = assets.byKey.get(key) || assets.byKey.get(baseName)

    if (found) return found

    const outputName = uniqueAssetName(postSlug, key, assets.used)
    assets.byKey.set(key, outputName)
    assets.missing.set(outputName, key)
    return outputName
}

/**
 * 去掉 ./ 前缀和 note.md_assets/ 目录前缀
 */
function normalizeAssetKey(raw: string): string {
    return raw
        .split('|')[0]
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\.\//, '')
        .replace(/^\/+/, '')
        .replace(/^.*?\.md_assets\//, '')
}

/**
 * 输出文件名：{postSlug}__{原相对路径用 - 展平}
 * 冲突时追加源路径的短 hash，保证构建可重复
 */
function uniqueAssetName(postSlug: string, relative: string, used: Set<string>): string {
    const flattened = relative.replace(/\//g, '-')
    let name = `${postSlug}__${flattened}`
    let key = name.toLowerCase()

    if (used.has(key)) {
        const suffix = hashString(relative).slice(0, 6)
        name = `${postSlug}__${flattened}-${suffix}`
        key = name.toLowerCase()
        let i = 2
        while (used.has(key)) {
            name = `${postSlug}__${flattened}-${suffix}-${i++}`
            key = name.toLowerCase()
        }
    }

    used.add(key)
    return name
}

function hashString(value: string): string {
    return crypto.createHash('sha1').update(value).digest('hex')
}

/**
 * 复制文章关联的图片资产
 */
function copyPostAssets(assets: AssetMap, imagesDir: string): number {
    let copied = 0
    for (const [outputName, sourcePath] of assets.files) {
        fs.copyFileSync(sourcePath, path.join(imagesDir, outputName))
        copied++
    }
    return copied
}

/**
 * 为引用了但源目录中缺失的图片创建 1×1 透明 PNG 占位符
 */
function createPlaceholderImages(assets: AssetMap, imagesDir: string): number {
    let created = 0
    for (const [outputName, original] of assets.missing) {
        const targetPath = path.join(imagesDir, outputName)
        if (fs.existsSync(targetPath)) continue
        fs.writeFileSync(targetPath, PLACEHOLDER_PNG)
        console.warn(`    ⚠ Missing image: ${original} -> ${outputName}`)
        created++
    }
    return created
}

/**
 * 递归复制目录
 */
function copyDir(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true })
    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath)
        } else {
            fs.copyFileSync(srcPath, destPath)
        }
    }
}
