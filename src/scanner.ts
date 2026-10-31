import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import matter from 'gray-matter'

export interface PostFrontMatter {
    title: string
    /** 发布日期，YYYY-MM-DD；同时是唯一的发布开关 */
    published: string
    /** 创建时间，Obsidian 维护，可选 */
    created: string
    /** 更新时间，Obsidian 维护，可选 */
    updated: string
    tags: string[]
    category: string
    description: string
    [key: string]: any
}

export interface Post {
    frontMatter: PostFrontMatter
    regularPath: string
    slug: string
    filePath: string
    content: string
}

/**
 * 扫描目录，解析所有 .md 文件的 frontmatter。
 *
 * 发布规则：
 *   - published 必须是一个日期（YYYY-MM-DD 或带时间的 ISO 字符串），有值才构建；
 *   - 没有 published / 空值 / false => 草稿，跳过；
 *   - title 必填，缺失则跳过；
 *   - tags / category / description / created / updated 可选。
 *
 * 嵌套目录会按相对路径展平进 slug，输出文件统一放在 posts/ 下。
 */
export function scanPosts(dir: string): Post[] {
    const absDir = path.resolve(dir)
    if (!fs.existsSync(absDir)) {
        throw new Error(`Directory not found: ${absDir}`)
    }

    const mdFiles = walkDir(absDir).filter(f => f.toLowerCase().endsWith('.md'))
    const posts: Post[] = []
    const drafts: string[] = []
    const invalid: string[] = []
    const usedSlugs = new Set<string>()

    for (const filePath of mdFiles) {
        const raw = fs.readFileSync(filePath, 'utf-8')
        const { data, content } = matter(raw)
        const relativePath = path.relative(absDir, filePath)

        // published 缺失、空值、false => 草稿
        if (isDraftValue(data.published)) {
            if (content.trim()) drafts.push(relativePath)
            continue
        }

        const published = parsePublishedDate(data.published)
        if (!published) {
            invalid.push(`${relativePath} (published 不是有效日期)`)
            continue
        }

        const title = typeof data.title === 'string' ? data.title.trim() : ''
        if (!title) {
            invalid.push(`${relativePath} (缺少 title)`)
            continue
        }

        const slug = uniqueSlug(generateSlug(relativePath, title), relativePath, usedSlugs)

        posts.push({
            frontMatter: {
                title,
                published,
                created: normalizeDateTime(data.created),
                updated: normalizeDateTime(data.updated),
                tags: normalizeTags(data.tags),
                category: normalizeCategory(data.category),
                description: normalizeText(data.description),
            },
            regularPath: `/posts/${slug}`,
            slug,
            filePath,
            content,
        })
    }

    posts.sort((a, b) => {
        const byDate = b.frontMatter.published.localeCompare(a.frontMatter.published)
        if (byDate !== 0) return byDate
        return a.frontMatter.title.localeCompare(b.frontMatter.title, 'zh-CN')
    })

    if (drafts.length > 0) {
        console.log(`  · ${drafts.length} draft(s) without published: skipped`)
    }
    for (const item of invalid) {
        console.warn(`  ⚠ Skipped: ${item}`)
    }

    return posts
}

/**
 * 递归遍历目录，返回所有文件路径
 */
function walkDir(dir: string): string[] {
    const results: string[] = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            // 跳过隐藏目录和 node_modules
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
            results.push(...walkDir(fullPath))
        } else {
            results.push(fullPath)
        }
    }

    return results
}

/**
 * 嵌套目录展平：
 *   教程/iOS App 实战系列/第一篇.md -> 教程-ios-app-实战系列-第一篇
 */
function generateSlug(relativePath: string, title: string): string {
    const segments = relativePath.replace(/\.md$/i, '').split(/[\\/]/)
    const slug = segments.map(slugify).filter(Boolean).join('-')
    return slug || slugify(title) || hashString(relativePath).slice(0, 8)
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w一-鿿-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

/**
 * 冲突时追加相对路径的短 hash，保证输出稳定
 */
function uniqueSlug(base: string, relativePath: string, used: Set<string>): string {
    let slug = base
    let key = slug.toLowerCase()
    if (used.has(key)) {
        const suffix = hashString(relativePath).slice(0, 6)
        slug = `${base}-${suffix}`
        key = slug.toLowerCase()
        let i = 2
        while (used.has(key)) {
            slug = `${base}-${suffix}-${i++}`
            key = slug.toLowerCase()
        }
    }
    used.add(key)
    return slug
}

function hashString(value: string): string {
    return crypto.createHash('sha1').update(value).digest('hex')
}

function isDraftValue(value: any): boolean {
    return value === undefined || value === null || value === '' || value === false
}

/**
 * published 只接受日期 / 日期时间；true、false、无效字符串一律返回 null
 */
function parsePublishedDate(value: any): string | null {
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : formatDate(value)
    }
    if (typeof value === 'string') {
        const text = value.trim()
        if (!text) return null

        const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/)
        if (dateOnly) {
            const y = Number(dateOnly[1])
            const m = Number(dateOnly[2])
            const d = Number(dateOnly[3])
            return isValidDateParts(y, m, d)
                ? `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`
                : null
        }

        const parsed = new Date(text)
        return isNaN(parsed.getTime()) ? null : formatDate(parsed)
    }
    return null
}

function isValidDateParts(y: number, m: number, d: number): boolean {
    const dt = new Date(Date.UTC(y, m - 1, d))
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/**
 * 格式化为 YYYY-MM-DD。Date 对象使用 UTC，避免 YAML 日期在时区边界偏移。
 */
function formatDate(date: Date): string {
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(date.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

/**
 * created / updated 只做保留，不参与发布判断
 */
function normalizeDateTime(value: any): string {
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 16)
    }
    if (typeof value === 'string') return value.trim()
    return ''
}

/**
 * 标准化 tags 为字符串数组：去空格、去空值、去重
 */
function normalizeTags(tags: any): string[] {
    let values: string[] = []

    if (Array.isArray(tags)) {
        values = tags.map(t => String(t).trim())
    } else if (typeof tags === 'string') {
        values = tags.split(',').map(t => t.trim())
    } else if (tags !== undefined && tags !== null) {
        values = [String(tags).trim()]
    }

    const result: string[] = []
    const seen = new Set<string>()
    for (const value of values) {
        if (!value || seen.has(value)) continue
        seen.add(value)
        result.push(value)
    }
    return result
}

/**
 * 分类只保留单个字符串，并去掉末尾的逗号/分号
 */
function normalizeCategory(value: any): string {
    if (typeof value !== 'string') return ''
    return value.trim().replace(/[,，;；\s]+$/g, '').trim()
}

function normalizeText(value: any): string {
    return typeof value === 'string' ? value.trim() : ''
}
