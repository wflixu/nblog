import { defineConfig } from 'vitepress'
import { getPageBlocks, getPosts } from './theme/serverUtils'

//每页的文章数量
const pageSize = 10

function isValidJSON(jsonString) {
    try {
        JSON.parse(jsonString);
        return true; // JSON 格式有效
    } catch (error) {
        return false; // JSON 格式无效
    }
}

function fixInvalidJSON(jsonString) {
    // 替换未引用的属性名和值
    const fixedJson = jsonString
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // 属性名添加双引号
        .replace(/:\s*([^"\d{[].*?)([,\]}])/g, ':"$1"$2') // 非引用的值加双引号
        .replace(/(["'])((?:(?!\1).)*?)(["'])/g, (match, p1, p2, p3) => {
            if (p1 === p3) return match; // 引号匹配，无需修改
            return `"${p2}"`; // 替换为双引号
        });

    return fixedJson;
}



export default defineConfig({
    title: 'Today',
    base: '/',
    outDir: 'dist',
    cacheDir: './node_modules/vitepress_cache',
    description: 'vitepress,blog,blog-theme',
    ignoreDeadLinks: true,
    head: [
        ['link', { rel: 'icon', type: 'image/*', href: '/favicon.svg' }],
        [
            'script',
            { defer: '', src: 'https://static.cloudflareinsights.com/beacon.min.js', 'data-cf-beacon': '{"token": "5d1014e67a9c4a1a82bdb180c4f8f008"}' }
        ],

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
    async transformPageData(pageData, { siteConfig }) {
        console.log('pageData:', pageData.params)
        if (pageData.params?.id && pageData.params?.last_edited_time) {
            let blocks = await getPageBlocks(pageData.params.id, pageData.params.last_edited_time)
            console.log('blocks:', blocks)

            let blocksJson = '{}'
            try {
                blocksJson = JSON.stringify(blocks)
                let isValid = isValidJSON(blocksJson)
                if (!isValid) {
                    blocksJson = fixInvalidJSON(blocksJson)
                    blocks = JSON.parse(blocksJson)
                }
            } catch (error) {
                console.warn('error:', error)
            }
            return {
                blocks,
            }
        } else {
            return {}
        }

    }
    /*
      optimizeDeps: {
          keepNames: true
      }
      */
})
