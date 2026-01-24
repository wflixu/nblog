import { defineConfig } from 'vitepress'
import { getPageBlocks, getPosts } from './theme/serverUtils'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

//每页的文章数量
const pageSize = 10

// 创建公共 blocks 数据目录
const blocksDir = path.resolve(process.cwd(), 'public', 'blocks-data')
mkdirSync(blocksDir, { recursive: true })

export default defineConfig({
    title: 'Today',
    base: '/',
    outDir: 'dist',
    cacheDir: './node_modules/vitepress_cache',
    description: 'vitepress,blog,blog-theme',
    ignoreDeadLinks: true,
    head: [
        ['link', { rel: 'icon', type: 'image/*', href: '/favicon.svg' }],
    ],
    sitemap: {
        hostname: 'https://blog.wflixu.cn',
        lastmodDateOnly: false
    },
    themeConfig: {
        posts: await getPosts(pageSize),
        website: 'https://github.com/wflixu/nblog', //copyright link
        // 评论的仓库地址
        comment: {
            repo: 'wflixu/nblog',
            themes: 'github-light',
            issueTerm: 'pathname'
        },
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Category', link: '/pages/category' },
            { text: 'Archives', link: '/pages/archives' },
            { text: 'Tags', link: '/pages/tags' },
            { text: 'About', link: '/pages/about' }
        ],
        search: {
            provider: 'local',
        },
        //outline:[2,3],
        outline: {
            label: '文章摘要'
        },
        socialLinks: [{ icon: 'github', link: 'https://github.com/wflixu/nblog' }]
    } as any,
    srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
    vite: {
        //build: { minify: false }
        server: { port: 5000 },
    },
    async transformHead() {
        // 只在生产构建时添加 Cloudflare Insights（避免开发环境 CORS 错误）
        const isProduction = process.env.NODE_ENV === 'production'
        if (isProduction) {
            return [
                [
                    'script',
                    { defer: '', src: 'https://static.cloudflareinsights.com/beacon.min.js', 'data-cf-beacon': '{"token": "5d1014e67a9c4a1a82bdb180c4f8f008"}' }
                ]
            ]
        }
        return []
    },
    async transformPageData(pageData) {
        if (pageData.params?.id && pageData.params?.last_edited_time) {
            const blocks = await getPageBlocks(pageData.params.id, pageData.params.last_edited_time)

            console.warn('Writing blocks for page:', pageData.params.id, blocks.length)

            // 将 blocks 写入独立的 JSON 文件，避免序列化到 HTML 中的问题
            const blocksFilePath = path.join(blocksDir, `${pageData.params.id}.json`)
            writeFileSync(blocksFilePath, JSON.stringify(blocks), 'utf-8')

            // 只返回 blocks 文件的路径，而不是 blocks 数据本身
            return {
                blocksPath: `/blocks-data/${pageData.params.id}.json`
            }
        }
        return {}
    }
    /*
      optimizeDeps: {
          keepNames: true
      }
      */
})
