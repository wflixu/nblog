/**
 * Obsidian 语法预处理
 * 在 CLI 构建阶段将 Obsidian 特有语法转换为标准 Markdown/HTML
 */

export interface TransformOptions {
    /** 图片嵌入：传入原始引用名，返回输出到 public/images/ 下的文件名 */
    resolveImage?: (filename: string) => string
    /** wikilink：传入目标笔记名，返回文章 slug；返回 undefined 则按默认规则处理 */
    resolvePostLink?: (target: string) => string | undefined
}

/**
 * 处理所有 Obsidian 语法
 */
export function transformObsidianSyntax(
    content: string,
    options: TransformOptions = {}
): string {
    // 先把代码块和行内代码替换成占位符，转换完成后再还原。
    // 不能用 split 按奇偶切分：双反引号行内代码会让奇偶错位，
    // 导致后面的正文被误当成代码而跳过转换。
    const { text, restore } = protectCode(content)

    let result = text
    // 先还原迁移脚本留下的转义语法（!\[\[...\]\] / \_assets），再转义裸 HTML。
    // 顺序很重要：HTML 转义必须在 callout 生成 <blockquote> 之前完成，
    // 否则生成的 callout HTML 会被当成裸 HTML 再转义一次。
    result = unescapeObsidianLinks(result)
    result = escapeBareHtmlTags(result)
    result = transformCallouts(result)
    result = transformWikilinks(result, options.resolvePostLink)
    result = transformImageEmbeds(result, options.resolveImage)
    result = transformHighlights(result)

    return restore(result)
}

const CODE_PLACEHOLDER_PREFIX = '\u0000NBLOG_CODE_'
const CODE_PLACEHOLDER_RE = /\u0000NBLOG_CODE_(\d+)\u0000/g

/**
 * 用占位符保护 fenced code（``` / ~~~）和行内代码（支持多个反引号）
 */
function protectCode(content: string): { text: string; restore: (value: string) => string } {
    const blocks: string[] = []

    const text = content.replace(
        /```[\s\S]*?```|~~~[\s\S]*?~~~|(`+)([\s\S]*?)\1/g,
        (match) => {
            const index = blocks.length
            blocks.push(match)
            return `${CODE_PLACEHOLDER_PREFIX}${index}\u0000`
        }
    )

    return {
        text,
        restore: (value) =>
            value.replace(CODE_PLACEHOLDER_RE, (_, index) => blocks[Number(index)] ?? ''),
    }
}

/**
 * 还原从 Notion 迁移时产生的转义语法
 * !\[\[note.md\_assets/a.png\]\] → ![[note.md_assets/a.png]]
 * \[\[page\]\] → [[page]]
 */
function unescapeObsidianLinks(content: string): string {
    return content
        .replace(/!\\\[\\\[([\s\S]*?)\\\]\\\]/g, (_, inner) => `![[${inner.replace(/\\_/g, '_')}]]`)
        .replace(/\\\[\\\[([\s\S]*?)\\\]\\\]/g, (_, inner) => `[[${inner.replace(/\\_/g, '_')}]]`)
}

/**
 * 转换 Obsidian callout 语法
 * > [!note] Title
 * > content
 * ↓
 * <blockquote class="callout callout-note">
 *   <div class="callout-title"><span class="callout-icon">📝</span> Title</div>
 *   <p>content</p>
 * </blockquote>
 */
function transformCallouts(content: string): string {
    const lines = content.split('\n')
    const result: string[] = []
    let i = 0

    while (i < lines.length) {
        const line = lines[i]
        const calloutMatch = line.match(/^>\s*\[!([\w-]+)\]\s*(.*)$/)

        if (calloutMatch) {
            const type = calloutMatch[1].toLowerCase()
            const title = calloutMatch[2] || capitalize(type)
            const icon = getCalloutIcon(type)

            result.push(`<blockquote class="callout callout-${type}">`)
            result.push(`<div class="callout-title"><span class="callout-icon">${icon}</span> ${title}</div>`)

            i++
            // 收集 callout 内容
            while (i < lines.length) {
                const contentLine = lines[i]
                if (contentLine.startsWith('>')) {
                    const inner = contentLine.slice(1).trimStart()
                    if (inner === '') {
                        result.push('')
                    } else {
                        result.push(inner)
                    }
                    i++
                } else if (contentLine.trim() === '') {
                    // 空行可能是 callout 结束，也可能是内容的一部分
                    // 看下一行是否还是 callout 内容
                    if (i + 1 < lines.length && lines[i + 1].startsWith('>')) {
                        result.push('')
                        i++
                    } else {
                        break
                    }
                } else {
                    break
                }
            }

            result.push('</blockquote>')
        } else {
            result.push(line)
            i++
        }
    }

    return result.join('\n')
}

/**
 * 转换 wikilinks
 * [[page]] → [page](/posts/page)
 * [[page|alias]] → [alias](/posts/page)
 *
 * 注意：不匹配 ![[image.png]] 图片嵌入（由 transformImageEmbeds 处理）
 */
function transformWikilinks(
    content: string,
    resolvePostLink?: (target: string) => string | undefined
): string {
    return content.replace(/(?<!!)\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (match, rawTarget, alias) => {
        const text = alias || rawTarget
        // [[Note#Heading]] 只按 Note 解析
        const target = rawTarget.split('#')[0].trim()
        const slug = resolvePostLink?.(target) || slugifyLink(target)
        return `[${text}](/posts/${slug})`
    })
}

function slugifyLink(value: string): string {
    const slug = value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w一-鿿-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    return slug || encodeURIComponent(value.trim())
}

/**
 * 转换 Obsidian 图片嵌入
 * ![[image.png]] → ![image](/images/image.png)
 * ![[note.md_assets/image.png]] → ![image](/images/image.png)
 * ![[image.png|300]] → ![image](/images/image.png)
 *
 * 输出文件名由 resolveImage 决定（展平 + 文章 slug 前缀）；没有 resolver 时
 * 默认把子目录展平成 -，保证输出平铺。
 */
function transformImageEmbeds(
    content: string,
    resolveImage?: (filename: string) => string
): string {
    return content.replace(/!\[\[([^\]]+?)\]\]/g, (match, raw) => {
        // Obsidian 的 |300 是尺寸别名，不参与文件名
        const target = raw.split('|')[0].trim()
        const cleanName = target.replace(/^.*?\.md_assets\//, '').replace(/^\/+/, '')
        const name = (cleanName.split('/').pop() || cleanName).replace(/\.[^.]+$/, '')

        const outputName = (
            resolveImage ? resolveImage(target) : cleanName.replace(/\//g, '-')
        ) || cleanName || 'image'

        // 图片名可能包含空格/中文，# 和 ? 需要编码，否则 Markdown 链接会被截断
        const encoded = outputName.split('/').map(encodeURIComponent).join('/')
        return `![${name}](/images/${encoded})`
    })
}

/**
 * 转换高亮语法
 * ==text== → <mark>text</mark>
 */
function transformHighlights(content: string): string {
    return content.replace(/==(.+?)==/g, '<mark>$1</mark>')
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function getCalloutIcon(type: string): string {
    const icons: Record<string, string> = {
        note: '📝',
        tip: '💡',
        warning: '⚠️',
        danger: '🚨',
        info: 'ℹ️',
        example: '📋',
        quote: '💬',
        question: '❓',
        success: '✅',
        failure: '❌',
        bug: '🐛',
    }
    return icons[type] || '📌'
}

/**
 * 转义代码块外的裸 HTML 标签
 * 防止 Vue 编译器将 markdown 中的 <template>、<script> 等当作 Vue SFC 语法解析
 */
function escapeBareHtmlTags(content: string): string {
    // 常见 HTML 标签名（小写）
    const htmlTags = [
        'template', 'script', 'style', 'div', 'span',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'a', 'b', 'i', 'strong', 'em', 'br', 'hr',
        'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
        'thead', 'tbody', 'tfoot', 'caption', 'colgroup', 'col',
        'section', 'article', 'nav', 'header', 'footer', 'main',
        'aside', 'figure', 'figcaption', 'details', 'summary',
        'pre', 'code', 'kbd', 'samp', 'var', 'blockquote',
        'dl', 'dt', 'dd', 'form', 'input', 'button', 'select',
        'textarea', 'label', 'fieldset', 'legend',
        'img', 'video', 'audio', 'source', 'picture',
        'canvas', 'svg', 'iframe', 'embed', 'object',
        'link', 'meta', 'title',
        'vue', 'router-link', 'router-view',
    ]
    const tagPattern = new RegExp(`<\\/?(${htmlTags.join('|')})([^>]*)>`, 'gi')

    return content.replace(tagPattern, (match) => {
        // 跳过已经是实体的
        if (match.includes('&lt;') || match.includes('&gt;')) return match
        return match.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    })
}
