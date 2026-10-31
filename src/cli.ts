import { program } from 'commander'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { ZipFile } from 'yazl'
import { scanPosts } from './scanner'
import { prepareBuildDir } from './generate-config'
import { buildSite, startDevServer } from './build'
import { loadConfig, writeConfig, NblogConfig } from './config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 获取 template 目录路径
 * 开发模式: 项目根/template
 * 全局安装: 包根/template
 */
function getTemplateDir(): string {
    const pkgRoot = path.resolve(__dirname, '..')
    const templateDir = path.join(pkgRoot, 'template')

    if (fs.existsSync(templateDir)) {
        return templateDir
    }

    // fallback: 从当前工作目录查找
    const cwdTemplate = path.resolve(process.cwd(), 'template')
    if (fs.existsSync(cwdTemplate)) {
        return cwdTemplate
    }

    throw new Error(`Template directory not found. Looked in:\n  ${templateDir}\n  ${cwdTemplate}`)
}

/**
 * 包根目录（开发模式是仓库根，全局安装时是 nblog 包目录）
 */
function getPackageRoot(): string {
    return path.resolve(__dirname, '..')
}

/**
 * 展开 ~ 为用户主目录
 */
function expandHome(p: string): string {
    if (p === '~') return os.homedir()
    if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2))
    return p
}

/**
 * 在系统临时目录创建唯一的构建目录，避免污染全局包目录。
 */
function makeTempBuildDir(): string {
    // macOS 的 os.tmpdir() 是 /var/folders/...，Vite 会解析成 /private/var/...
    // 先 realpath，保证 dev server 的 Vite root 和实际文件路径一致。
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nblog-'))
    return fs.realpathSync(dir)
}

/**
 * 把包自带的 node_modules 软链到临时构建目录，
 * 保证在任意工作目录 / 全局安装下都能解析 vitepress 和 vue。
 */
function linkNodeModules(buildDir: string): void {
    const target = path.join(getPackageRoot(), 'node_modules')
    if (!fs.existsSync(target)) {
        throw new Error(`node_modules not found in package root: ${target}`)
    }

    const linkPath = path.join(buildDir, 'node_modules')
    if (fs.existsSync(linkPath)) return

    fs.symlinkSync(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir')
}

/**
 * 清理 zip 基础名：去掉 .zip、替换不安全字符、空格转 -
 */
function sanitizeBaseName(value: string): string {
    const cleaned = value
        .trim()
        .replace(/\.zip$/i, '')
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[-.]+|[-.]+$/g, '')

    return cleaned || 'blog'
}

/**
 * 解析 zip 输出路径：
 *   - 未指定 output：当前目录/<name>.zip
 *   - output 以 .zip 结尾：直接作为 zip 文件
 *   - 否则视为目录：<output>/<name>.zip
 */
function resolveZipPath(output: string | undefined, name: string): string {
    const base = `${name}.zip`
    if (!output) return path.resolve(process.cwd(), base)

    const absPath = path.resolve(expandHome(output))
    if (absPath.toLowerCase().endsWith('.zip')) return absPath
    return path.join(absPath, base)
}

/**
 * 解析 --no-zip 时的静态输出目录
 */
function resolveRawDir(output: string | undefined, name: string): string {
    if (!output) return path.resolve(process.cwd(), name)
    return path.resolve(expandHome(output))
}

function ensureParentDir(filePath: string): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

/**
 * 递归列出目录文件，跳过 .DS_Store 等隐藏文件
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
 * 用 yazl 生成 zip。yazl 会为中文文件名写入 UTF-8 标志，
 * 避免 macOS 自带 zip 在 Linux 上解压乱码。
 */
async function createZip(
    sourceDir: string,
    zipPath: string
): Promise<{ files: number; bytes: number }> {
    ensureParentDir(zipPath)

    const files = walkFiles(sourceDir)
    const tempZip = `${zipPath}.tmp-${process.pid}-${Date.now()}`
    const zipfile = new ZipFile()

    for (const file of files) {
        const relativePath = path.relative(sourceDir, file).split(path.sep).join('/')
        zipfile.addFile(file, relativePath)
    }

    try {
        await new Promise<void>((resolve, reject) => {
            const output = fs.createWriteStream(tempZip)
            output.on('close', () => resolve())
            output.on('error', reject)
            ;(zipfile.outputStream as any).on('error', reject)
            zipfile.outputStream.pipe(output)
            zipfile.end()
        })

        fs.rmSync(zipPath, { force: true })
        fs.renameSync(tempZip, zipPath)
    } catch (err) {
        fs.rmSync(tempZip, { force: true })
        throw err
    }

    const stat = fs.statSync(zipPath)
    return { files: files.length, bytes: stat.size }
}

/**
 * 把 dist 的内容复制到目标目录（不保留 dist/ 这一层）
 */
function copyDirContents(sourceDir: string, destDir: string): void {
    if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true })
    }
    fs.mkdirSync(destDir, { recursive: true })

    for (const entry of fs.readdirSync(sourceDir)) {
        fs.cpSync(path.join(sourceDir, entry), path.join(destDir, entry), {
            recursive: true,
        })
    }
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * dev 退出时清理临时构建目录
 */
function registerDevCleanup(buildDir: string): void {
    let cleaned = false
    const cleanup = () => {
        if (cleaned) return
        cleaned = true
        try {
            fs.rmSync(buildDir, { recursive: true, force: true })
        } catch {
            // ignore cleanup errors
        }
    }

    process.on('exit', cleanup)
    process.on('SIGINT', () => {
        cleanup()
        process.exit(0)
    })
    process.on('SIGTERM', () => {
        cleanup()
        process.exit(0)
    })
}

/**
 * 等待 VitePress 的 sitemap 写流完成。
 * VitePress 1.6 的 generateSitemap 在 build() 返回后才异步写文件，
 * 如果立刻打包/删除输出目录，会出现 ENOENT。
 */
async function waitForSitemap(outDir: string, enabled: boolean): Promise<void> {
    if (!enabled) return

    const sitemapPath = path.join(outDir, 'sitemap.xml')
    const deadline = Date.now() + 5000
    let lastSize = -1
    let stable = 0

    while (Date.now() < deadline) {
        if (fs.existsSync(sitemapPath)) {
            const size = fs.statSync(sitemapPath).size
            if (size > 0 && size === lastSize) {
                stable++
                if (stable >= 2) return
            } else {
                stable = 0
                lastSize = size
            }
        }
        await new Promise(resolve => setTimeout(resolve, 50))
    }

    console.warn('  ⚠ sitemap.xml was not ready within 5s, continuing')
}

program
    .name('nblog')
    .description('Build beautiful blogs from Obsidian markdown files')
    .version('2.0.0')
    .option('--config <path>', 'Path to config file')

program
    .command('build [dir]')
    .description('Build a static blog zip from an Obsidian blog directory')
    .option('-o, --output <path>', 'Zip file path, or directory to write the zip into')
    .option('--name <name>', 'Zip base name (default: source directory name)')
    .option('--no-zip', 'Write static files to a directory instead of creating a zip')
    .option('--title <title>', 'Site title')
    .option('--base <path>', 'Base URL path')
    .option('--description <desc>', 'Site description')
    .option('--hostname <hostname>', 'Site hostname for sitemap')
    .option('--theme <theme>', 'Theme name (notion | claude-docs)')
    .action(async (dir: string | undefined, opts: any) => {
        try {
            const globalOpts = program.opts()
            const cfg = loadConfig(globalOpts.config)

            // CLI 参数优先，配置次之
            const sourceDir = resolveDir(dir, cfg, 'build')
            const title = opts.title || cfg.title
            const base = opts.base || cfg.base || '/'
            const description = opts.description || cfg.description
            const hostname = opts.hostname || cfg.hostname
            const theme = opts.theme || cfg.theme || 'notion'
            const output = opts.output || cfg.output
            const shouldZip = opts.zip !== false
            const name = sanitizeBaseName(
                opts.name || cfg.name || path.basename(sourceDir) || 'blog'
            )

            // 1. 扫描 Obsidian 目录
            console.log(`\n  Scanning: ${sourceDir}`)
            const posts = scanPosts(sourceDir)
            console.log(`  Found ${posts.length} published posts`)

            if (posts.length === 0) {
                console.log('\n  No posts found. Make sure your .md files have "title" and "published" (date) in frontmatter.\n')
                process.exit(0)
            }

            // 2. 准备临时构建目录
            const buildDir = makeTempBuildDir()
            try {
                const templateDir = getTemplateDir()
                console.log(`  Template: ${templateDir}`)

                prepareBuildDir(posts, templateDir, {
                    title,
                    base,
                    description,
                    hostname,
                    theme,
                }, buildDir)
                console.log(`  Build dir: ${buildDir}`)
                linkNodeModules(buildDir)

                // 3. VitePress 构建
                console.log('  Building...\n')
                await buildSite(buildDir)

                const distDir = path.join(buildDir, 'dist')
                if (!fs.existsSync(distDir)) {
                    throw new Error(`VitePress output not found: ${distDir}`)
                }

                // 等 sitemap 写完再打包
                await waitForSitemap(distDir, !!hostname)

                // 4. 打包或输出静态目录
                if (shouldZip) {
                    const zipPath = resolveZipPath(output, name)
                    const result = await createZip(distDir, zipPath)
                    console.log(`  Zip: ${zipPath} (${result.files} files, ${formatBytes(result.bytes)})`)
                } else {
                    const outDir = resolveRawDir(output, name)
                    copyDirContents(distDir, outDir)
                    console.log(`  Output: ${outDir}`)
                }

                console.log('\n  Build complete!\n')
            } finally {
                fs.rmSync(buildDir, { recursive: true, force: true })
            }
        } catch (err) {
            console.error('\n  Build failed:', err)
            process.exit(1)
        }
    })

program
    .command('dev [dir]')
    .description('Start dev server from an Obsidian blog directory')
    .option('--port <port>', 'Dev server port')
    .option('--title <title>', 'Site title')
    .option('--base <path>', 'Base URL path')
    .option('--description <desc>', 'Site description')
    .option('--theme <theme>', 'Theme name (notion | claude-docs)')
    .action(async (dir: string | undefined, opts: any) => {
        try {
            const globalOpts = program.opts()
            const cfg = loadConfig(globalOpts.config)

            const sourceDir = resolveDir(dir, cfg, 'dev')
            const title = opts.title || cfg.title
            const base = opts.base || cfg.base || '/'
            const description = opts.description || cfg.description
            const theme = opts.theme || cfg.theme || 'notion'
            const port = opts.port || cfg.port || 5000

            // 1. 扫描
            console.log(`\n  Scanning: ${sourceDir}`)
            const posts = scanPosts(sourceDir)
            console.log(`  Found ${posts.length} published posts`)

            // 2. 临时构建目录
            const buildDir = makeTempBuildDir()
            try {
                const templateDir = getTemplateDir()
                prepareBuildDir(posts, templateDir, {
                    title,
                    base,
                    description,
                    theme,
                }, buildDir)
                console.log(`  Build dir: ${buildDir}`)
                linkNodeModules(buildDir)
                registerDevCleanup(buildDir)

                // 3. 启动开发服务器
                const portNum = parseInt(String(port), 10)
                await startDevServer(buildDir, portNum)
            } catch (err) {
                fs.rmSync(buildDir, { recursive: true, force: true })
                throw err
            }
        } catch (err) {
            console.error('\n  Dev server failed:', err)
            process.exit(1)
        }
    })

program
    .command('init [dir]')
    .description('Create nblog config file in current directory')
    .option('--title <title>', 'Site title')
    .option('--theme <theme>', 'Theme name (notion | claude-docs)')
    .option('--name <name>', 'Default zip base name')
    .option('--port <port>', 'Dev server port')
    .action((dir: string | undefined, opts: any) => {
        const sourceDir = dir ? path.resolve(dir) : undefined
        if (!sourceDir) {
            console.error('\n  Usage: nblog init <path-to-blog-directory>\n')
            process.exit(1)
        }
        if (!fs.existsSync(sourceDir)) {
            console.error(`\n  Directory not found: ${sourceDir}\n`)
            process.exit(1)
        }

        const config: NblogConfig = {
            source: sourceDir,
        }
        if (opts.title) config.title = opts.title
        if (opts.theme) config.theme = opts.theme
        if (opts.name) config.name = opts.name
        if (opts.port) config.port = Number(opts.port)

        const configPath = writeConfig(config)
        console.log(`\n  Config created: ${configPath}`)
        console.log(`  Source directory: ${sourceDir}\n`)
    })

program.parse()

/**
 * 解析源目录路径：CLI 参数 > 配置文件 > 错误提示
 */
function resolveDir(dir: string | undefined, cfg: NblogConfig, command: string): string {
    const target = dir || cfg.source
    if (target) {
        return path.resolve(expandHome(target))
    }

    console.error(`\n  Error: Missing source directory.\n`)
    console.error(`  Usage: nblog ${command} <path-to-obsidian-blogs>\n`)
    console.error(`  Or set "source" in nblog.config.json:\n`)
    console.error(`    { "source": "~/path/to/obsidian/blogs" }\n`)
    process.exit(1)
}
