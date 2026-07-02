import fs from 'fs'
import path from 'path'
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

/**
 * 准备构建目录：复制模板、写入数据、生成文章页面
 */
export function prepareBuildDir(
    posts: Post[],
    templateDir: string,
    userConfig: Partial<SiteConfig>
): string {
    // 过滤掉 undefined 值，避免覆盖默认值
    const filteredConfig = Object.fromEntries(
        Object.entries(userConfig).filter(([_, v]) => v !== undefined)
    )
    const config = { ...DEFAULT_CONFIG, ...filteredConfig }
    const buildDir = path.resolve('.nblog-build')

    // 清理并创建构建目录
    if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true })
    }
    fs.mkdirSync(buildDir, { recursive: true })

    // 复制模板目录
    copyDir(templateDir, buildDir)

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

    for (const post of posts) {
        const md = generatePostMarkdown(post)
        fs.writeFileSync(path.join(postsDir, `${post.slug}.md`), md, 'utf-8')
        // 复制关联的图片资产
        copyPostAssets(post.filePath, imagesDir)
    }

    // 为标记中引用了但资产目录中缺失的图片创建 1x1 占位符
    ensurePlaceholderImages(posts, imagesDir)

    // 写入站点配置
    writeSiteConfig(buildDir, config)

    return buildDir
}

/**
 * 生成单篇文章的 Markdown
 */
function generatePostMarkdown(post: Post): string {
    const frontmatter = [
        '---',
        `title: "${escapeYaml(post.frontMatter.title)}"`,
        `date: "${post.frontMatter.date}"`,
    ]

    if (post.frontMatter.tags.length > 0) {
        frontmatter.push('tags:')
        for (const tag of post.frontMatter.tags) {
            frontmatter.push(`  - ${tag}`)
        }
    }

    if (post.frontMatter.category) {
        frontmatter.push(`category: "${escapeYaml(post.frontMatter.category)}"`)
    }

    if (post.frontMatter.description) {
        frontmatter.push(`description: "${escapeYaml(post.frontMatter.description)}"`)
    }

    frontmatter.push('---')
    frontmatter.push('')

    // 转换 Obsidian 语法
    const content = transformObsidianSyntax(post.content)

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

function escapeYaml(str: string): string {
    return str.replace(/"/g, '\\"')
}

function escapeSingleQuote(str: string): string {
    return str.replace(/'/g, "\\'")
}

/**
 * 为生成的帖子中引用但缺失的图片创建 1×1 透明 PNG 占位符
 * 避免 VitePress 构建时因找不到图片而报错
 */
function ensurePlaceholderImages(posts: Post[], imagesDir: string): void {
    const placeholder = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
    )
    let created = 0
    for (const post of posts) {
        // 在生成的 markdown 中搜索 /images/ 引用
        const refs = post.content.match(/!\[\[([^\]]+?)\]\]/g)
        if (!refs) continue
        for (const ref of refs) {
            const filename = ref.replace(/!\[\[([^\]]+?)\]\]/, '$1')
                .replace(/^.*?\.md_assets\//, '')
            const targetPath = path.join(imagesDir, filename)
            if (!fs.existsSync(targetPath)) {
                fs.writeFileSync(targetPath, placeholder)
                created++
            }
        }
    }
    if (created > 0) {
        console.log(`    🖼 Created ${created} placeholder images for missing files`)
    }
}

/**
 * 复制文章关联的图片资产
 * Obsidian 通常将图片保存在 {filename}.md_assets/ 目录
 */
function copyPostAssets(sourceFilePath: string, destImagesDir: string): void {
    const assetsDir = sourceFilePath.replace(/\.md$/, '.md_assets')
    if (!fs.existsSync(assetsDir)) return

    let copied = 0
    const entries = fs.readdirSync(assetsDir, { withFileTypes: true })
    for (const entry of entries) {
        if (entry.isFile()) {
            const src = path.join(assetsDir, entry.name)
            const dest = path.join(destImagesDir, entry.name)
            fs.copyFileSync(src, dest)
            copied++
        }
    }
    if (copied > 0) {
        console.log(`    📷 Copied ${copied} images from ${path.basename(assetsDir)}`)
    }
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
