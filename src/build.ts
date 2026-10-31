import path from 'path'

/**
 * 使用 VitePress Node API 构建站点
 */
export async function buildSite(buildDir: string): Promise<void> {
    const { build } = await import('vitepress')
    await build(buildDir, {
        outDir: path.join(buildDir, 'dist'),
    })
}

/**
 * 使用 VitePress Node API 启动开发服务器
 */
export async function startDevServer(buildDir: string, port: number = 5000): Promise<void> {
    const { createServer } = await import('vitepress')
    const server = await createServer(buildDir, {})
    await server.listen(port)
    console.log(`\n  Dev server running at http://localhost:${port}\n`)
}
