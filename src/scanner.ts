import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface PostFrontMatter {
    title: string
    date: string
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
 * 扫描目录，解析所有 .md 文件的 frontmatter
 *
 * 标准字段（固定，无别名）：
 *   title       - 文章标题（必填）
 *   published   - 发布日期（必填，YYYY-MM-DD）
 *   tags        - 标签（可选，数组或逗号分隔）
 *   category    - 分类（可选）
 *   description - 简介（可选）
 */
export function scanPosts(dir: string): Post[] {
    const absDir = path.resolve(dir)
    if (!fs.existsSync(absDir)) {
        throw new Error(`Directory not found: ${absDir}`)
    }

    const files = walkDir(absDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    const posts: Post[] = []

    for (const filePath of mdFiles) {
        const raw = fs.readFileSync(filePath, 'utf-8')
        const { data, content } = matter(raw)

        // 必填：title + published
        const title = data.title
        const published = data.published

        if (!title || !published) {
            const relativePath = path.relative(absDir, filePath)
            if (content.trim()) {
                console.warn(`  ⚠ Skipped (no title/published): ${relativePath}`)
            }
            continue
        }

        const relativePath = path.relative(absDir, filePath)
        const slug = generateSlug(relativePath, title)

        posts.push({
            frontMatter: {
                title,
                date: formatDate(published),
                tags: normalizeTags(data.tags),
                category: data.category || '',
                description: data.description || '',
            },
            regularPath: `/posts/${slug}`,
            slug,
            filePath,
            content,
        })
    }

    // 按日期降序排序
    posts.sort((a, b) => new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime())

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
 * 生成 URL slug
 * 优先使用文件名，去掉扩展名和目录前缀
 */
function generateSlug(relativePath: string, title: string): string {
    // 使用文件名（不含扩展名）作为 slug
    const basename = path.basename(relativePath, '.md')
    return basename
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w一-鿿-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || encodeURIComponent(title)
}

/**
 * 标准化日期格式为 YYYY-MM-DD
 */
function formatDate(date: any): string {
    if (!date) return ''
    if (date instanceof Date) {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    }
    if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
        const d = new Date(date)
        if (!isNaN(d.getTime())) {
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            return `${y}-${m}-${day}`
        }
        return date
    }
    return String(date)
}

/**
 * 标准化 tags 为字符串数组
 */
function normalizeTags(tags: any): string[] {
    if (!tags) return []
    if (Array.isArray(tags)) return tags.map(String)
    if (typeof tags === 'string') {
        return tags.split(',').map(t => t.trim()).filter(Boolean)
    }
    return []
}
