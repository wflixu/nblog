import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 由 CLI 生成的 posts 数据
const postsDataPath = path.resolve(__dirname, 'posts-data.json')
const postsData = fs.existsSync(postsDataPath)
    ? JSON.parse(fs.readFileSync(postsDataPath, 'utf-8'))
    : []

export default defineConfig({
    title: 'My Blog',
    base: '/',
    description: 'A blog powered by nblog',
    ignoreDeadLinks: true,
    head: [
        ['link', { rel: 'icon', type: 'image/*', href: '/favicon.svg' }],
        ['script', {}, `(function(){try{var t=localStorage.getItem('nblog-theme')||'__DEFAULT_THEME__';document.documentElement.classList.add('theme-'+t)}catch(e){document.documentElement.classList.add('theme-__DEFAULT_THEME__')}})()`],
    ],
    themeConfig: {
        posts: postsData,
        website: 'https://github.com/wflixu/nblog',
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
        outline: {
            label: '文章摘要'
        },
        socialLinks: [{ icon: 'github', link: 'https://github.com/wflixu/nblog' }]
    } as any,
    srcExclude: ['README.md'],
    vite: {
        server: { port: 5000 },
    },
})
