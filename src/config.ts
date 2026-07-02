import fs from 'fs'
import path from 'path'

/**
 * nblog 配置文件接口
 * 支持 nblog.config.json 和 .nblogrc 两种格式
 */
export interface NblogConfig {
    /** Obsidian 博客目录路径 */
    source?: string
    /** 站点标题 */
    title?: string
    /** 站点描述 */
    description?: string
    /** 基础 URL 路径 */
    base?: string
    /** 站点域名（启用 sitemap） */
    hostname?: string
    /** 主题名称 (notion | claude-docs) */
    theme?: string
    /** 输出目录（仅 build） */
    output?: string
    /** 开发服务器端口（仅 dev） */
    port?: number
}

const CONFIG_FILES = ['nblog.config.json', '.nblogrc']

/**
 * 从当前目录或指定路径加载配置文件
 */
export function loadConfig(configPath?: string): NblogConfig {
    if (configPath) {
        const absPath = path.resolve(configPath)
        if (!fs.existsSync(absPath)) {
            throw new Error(`Config file not found: ${absPath}`)
        }
        return parseConfig(fs.readFileSync(absPath, 'utf-8'), absPath)
    }

    // 从当前目录向上查找配置文件
    let cwd = process.cwd()
    while (true) {
        for (const name of CONFIG_FILES) {
            const filePath = path.join(cwd, name)
            if (fs.existsSync(filePath)) {
                const raw = fs.readFileSync(filePath, 'utf-8')
                return parseConfig(raw, filePath)
            }
        }
        const parent = path.dirname(cwd)
        if (parent === cwd) break // 到根目录了
        cwd = parent
    }

    return {}
}

function parseConfig(raw: string, filePath: string): NblogConfig {
    try {
        const config = JSON.parse(raw)
        // 解析字段
        return {
            source: config.source || config.dir || undefined,
            title: config.title || undefined,
            description: config.description || undefined,
            base: config.base || undefined,
            hostname: config.hostname || undefined,
            theme: config.theme || undefined,
            output: config.output || undefined,
            port: config.port ? Number(config.port) : undefined,
        }
    } catch (err) {
        console.error(`  Failed to parse ${filePath}`)
        return {}
    }
}

/**
 * 写入配置到当前目录
 */
export function writeConfig(config: NblogConfig, filePath?: string): string {
    const targetPath = filePath
        ? path.resolve(filePath)
        : path.resolve(process.cwd(), 'nblog.config.json')

    const data: Record<string, any> = {}
    if (config.source) data.source = config.source
    if (config.title) data.title = config.title
    if (config.description) data.description = config.description
    if (config.base && config.base !== '/') data.base = config.base
    if (config.hostname) data.hostname = config.hostname
    if (config.theme && config.theme !== 'notion') data.theme = config.theme
    if (config.output) data.output = config.output
    if (config.port && config.port !== 5000) data.port = config.port

    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    return targetPath
}
