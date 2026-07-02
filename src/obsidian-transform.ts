/**
 * Obsidian 语法预处理
 * 在 CLI 构建阶段将 Obsidian 特有语法转换为标准 Markdown/HTML
 */

/**
 * 处理所有 Obsidian 语法
 */
export function transformObsidianSyntax(content: string): string {
    let result = content
    result = transformCallouts(result)
    result = transformWikilinks(result)
    result = transformImageEmbeds(result)
    result = transformHighlights(result)
    result = escapeBareHtmlTags(result)
    return result
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
function transformWikilinks(content: string): string {
    return content.replace(/(?<!!)\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (match, target, alias) => {
        const text = alias || target
        const slug = target.toLowerCase().replace(/\s+/g, '-')
        return `[${text}](/posts/${slug})`
    })
}

/**
 * 转换 Obsidian 图片嵌入
 * ![[image.png]] → ![image](/images/image.png)
 * ![[note.md_assets/image.png]] → ![image](/images/image.png)
 */
function transformImageEmbeds(content: string): string {
    return content.replace(/!\[\[([^\]]+?)\]\]/g, (match, filename) => {
        // 去掉 _assets 目录前缀
        const cleanName = filename.replace(/^.*?\.md_assets\//, '')
        const name = cleanName.replace(/\.[^.]+$/, '')
        return `![${name}](/images/${cleanName})`
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

    const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/)
    for (let i = 0; i < parts.length; i++) {
        // 奇数索引 => 代码块或行内代码，跳过
        if (i % 2 === 0) {
            parts[i] = parts[i].replace(tagPattern, (match) => {
                // 跳过已经是实体的
                if (match.includes('&lt;') || match.includes('&gt;')) return match
                return match.replace(/</g, '&lt;').replace(/>/g, '&gt;')
            })
        }
    }
    return parts.join('')
}
