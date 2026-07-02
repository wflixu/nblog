import { program } from 'commander'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
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
    // 从 dist/cli.mjs 向上一级到包根目录
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

program
    .name('nblog')
    .description('Build beautiful blogs from Obsidian markdown files')
    .version('2.0.0')
    .option('--config <path>', 'Path to config file')

program
    .command('build [dir]')
    .description('Build static site from Obsidian blog directory')
    .option('-o, --output <dir>', 'Output directory')
    .option('--title <title>', 'Site title')
    .option('--base <path>', 'Base URL path')
    .option('--description <desc>', 'Site description')
    .option('--hostname <hostname>', 'Site hostname for sitemap')
    .option('--theme <theme>', 'Theme name (notion | claude-docs)')
    .action(async (dir: string | undefined, opts: any) => {
        try {
            // 合并配置文件
            const globalOpts = program.opts()
            const cfg = loadConfig(globalOpts.config)

            // CLI 参数优先，配置次之
            const sourceDir = resolveDir(dir, cfg, 'build')
            const title = opts.title || cfg.title
            const base = opts.base || cfg.base || '/'
            const description = opts.description || cfg.description
            const hostname = opts.hostname || cfg.hostname
            const theme = opts.theme || cfg.theme || 'notion'
            const output = opts.output || cfg.output || './dist'

            // 1. 扫描 Obsidian 目录
            console.log(`\n  Scanning: ${sourceDir}`)
            const posts = scanPosts(sourceDir)
            console.log(`  Found ${posts.length} posts`)

            if (posts.length === 0) {
                console.log('\n  No posts found. Make sure your .md files have "title" and "published" in frontmatter.\n')
                process.exit(0)
            }

            // 2. 准备构建目录
            const templateDir = getTemplateDir()
            console.log(`  Template: ${templateDir}`)

            const buildDir = prepareBuildDir(posts, templateDir, {
                title,
                base,
                description,
                hostname,
                theme,
            })
            console.log(`  Build dir: ${buildDir}`)

            // 3. VitePress 构建
            console.log('  Building...\n')
            await buildSite(buildDir)

            // 4. 复制输出到目标目录
            const outputDir = path.resolve(output)
            const distDir = path.join(buildDir, 'dist')

            if (fs.existsSync(distDir)) {
                if (fs.existsSync(outputDir)) {
                    fs.rmSync(outputDir, { recursive: true })
                }
                fs.renameSync(distDir, outputDir)
                console.log(`  Output: ${outputDir}`)
            }

            // 5. 清理构建目录
            fs.rmSync(buildDir, { recursive: true })

            console.log('\n  Build complete!\n')
        } catch (err) {
            console.error('\n  Build failed:', err)
            process.exit(1)
        }
    })

program
    .command('dev [dir]')
    .description('Start dev server from Obsidian blog directory')
    .option('--port <port>', 'Dev server port')
    .option('--title <title>', 'Site title')
    .option('--base <path>', 'Base URL path')
    .option('--description <desc>', 'Site description')
    .option('--theme <theme>', 'Theme name (notion | claude-docs)')
    .action(async (dir: string | undefined, opts: any) => {
        try {
            // 合并配置文件
            const globalOpts = program.opts()
            const cfg = loadConfig(globalOpts.config)

            // CLI 参数优先，配置次之
            const sourceDir = resolveDir(dir, cfg, 'dev')
            const title = opts.title || cfg.title
            const base = opts.base || cfg.base || '/'
            const description = opts.description || cfg.description
            const theme = opts.theme || cfg.theme || 'notion'
            const port = opts.port || cfg.port || 5000

            // 1. 扫描
            console.log(`\n  Scanning: ${sourceDir}`)
            const posts = scanPosts(sourceDir)
            console.log(`  Found ${posts.length} posts`)

            // 2. 准备构建目录
            const templateDir = getTemplateDir()
            const buildDir = prepareBuildDir(posts, templateDir, {
                title,
                base,
                description,
                theme,
            })
            console.log(`  Build dir: ${buildDir}`)

            // 3. 启动开发服务器
            const portNum = parseInt(String(port), 10)
            await startDevServer(buildDir, portNum)
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
    if (dir) {
        return path.resolve(dir)
    }
    if (cfg.source) {
        return path.resolve(cfg.source)
    }
    console.error(`\n  Error: Missing source directory.\n`)
    console.error(`  Usage: nblog ${command} <path-to-blog-directory>\n`)
    console.error(`  Or create a config file in the current directory:\n`)
    console.error(`    nblog init /path/to/blogs\n`)
    process.exit(1)
}
