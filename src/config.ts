import fs from 'fs'
import path from 'path'
import os from 'os'

/**
 * nblog 配置文件接口
 * 支持 nblog.config.json 和 .nblogrc
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
    /** 输出路径：zip 文件、zip 所在目录，或 --no-zip 时的目录 */
    output?: string
    /** zip 基础名，默认取源目录名 */
    name?: string
    /** 开发服务器端口（仅 dev） */
    port?: number
}

const LOCAL_CONFIG_FILES = ['nblog.config.json', '.nblogrc']

/**
 * 用户级配置路径，按优先级排列
 */
function userConfigPaths(): string[] {
    return [
        path.join(os.homedir(), '.config', 'nblog', 'config.json'),
        path.join(os.homedir(), '.nblogrc'),
    ]
}

/**
 * 加载配置：
 *   1. --config 显式指定
 *   2. 当前目录的 nblog.config.json / .nblogrc
 *   3. ~/.config/nblog/config.json 或 ~/.nblogrc
 *   4. 默认值
 *
 * 当前目录配置会覆盖用户级配置的同名字段。
 */
export function loadConfig(configPath?: string): NblogConfig {
    if (configPath) {
        const absPath = path.resolve(configPath)
        if (!fs.existsSync(absPath)) {
            throw new Error(`Config file not found: ${absPath}`)
        }
        return parseConfig(fs.readFileSync(absPath, 'utf-8'), absPath)
    }

    // 用户级默认配置
    let config: NblogConfig = {}
    for (const filePath of userConfigPaths()) {
        if (fs.existsSync(filePath)) {
            config = parseConfig(fs.readFileSync(filePath, 'utf-8'), filePath)
            break
        }
    }

    // 当前目录配置覆盖用户级配置
    for (const name of LOCAL_CONFIG_FILES) {
        const filePath = path.resolve(process.cwd(), name)
        if (fs.existsSync(filePath)) {
            const local = parseConfig(fs.readFileSync(filePath, 'utf-8'), filePath)
            return { ...config, ...local }
        }
    }

    return config
}

function parseConfig(raw: string, filePath: string): NblogConfig {
    try {
        const config = JSON.parse(raw)
        return {
            source: config.source || config.dir || undefined,
            title: config.title || undefined,
            description: config.description || undefined,
            base: config.base || undefined,
            hostname: config.hostname || undefined,
            theme: config.theme || undefined,
            output: config.output || undefined,
            name: config.name || undefined,
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
    if (config.name) data.name = config.name
    if (config.port && config.port !== 5000) data.port = config.port

    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    return targetPath
}
