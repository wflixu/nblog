import { globby } from 'globby'
import matter from 'gray-matter'
import fs from 'fs-extra'
import { resolve } from 'path'


const API_HOST = 'https://api.notion.com/v1'

async function getPosts(pageSize: number) {
    const apiHost = API_HOST
    const databaseId = process.env.DATABASE_ID;
    const notionToken = process.env.NOTION_TOKEN;
    const url = `${apiHost}/databases/${databaseId}/query`;

    const results = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
            "filter": {
                "property": "状态",
                "select": {
                    "equals": "发布"
                }
            },
            "sorts": [
                {
                    "property": "Last edited time",
                    "direction": "descending"
                }
            ]
        })
    }).then(res => res.json()).then(data => {
        return data?.results ?? []
    }).catch(error => {
        console.log('apierror')
        console.error(error)
        return error
    })


    await generatePaginationPages(results.length, pageSize)

    let posts = results.map((item: any) => {
        const title = item.properties.Title.title[0].plain_text;
        console.log('building post:', title)
        const data = {
            title,
            date: _convertDate(item.last_edited_time),
            tags: item.properties.Tags.multi_select.map((tag: any) => tag.name),
            category: item.properties.Category.select?.name ?? '未分类',
        }

        return {
            frontMatter: data,
            regularPath: `/posts/${item.id}`
        }
    })

    posts.sort(_compareDate as any)
    return posts
}

async function generatePaginationPages(total: number, pageSize: number) {
    //  pagesNum
    let pagesNum = total % pageSize === 0 ? total / pageSize : Math.floor(total / pageSize) + 1
    const paths = resolve('./')
    if (total > 0) {
        for (let i = 1; i < pagesNum + 1; i++) {
            const page = `
---
page: true
title: ${i === 1 ? 'home' : 'page_' + i}
aside: false
---
<script setup>
import Page from "./.vitepress/theme/components/Page.vue";
import { useData } from "vitepress";
const { theme } = useData();
const posts = theme.value.posts.slice(${pageSize * (i - 1)},${pageSize * i})
</script>
<Page :posts="posts" :pageCurrent="${i}" :pagesNum="${pagesNum}" />
`.trim()
            const file = paths + `/page_${i}.md`
            await fs.writeFile(file, page)
        }
    }
    // rename page_1 to index for homepage
    await fs.move(paths + '/page_1.md', paths + '/index.md', { overwrite: true })
}

function _convertDate(date = new Date().toString()) {
    const json_date = new Date(date).toJSON()
    return json_date.split('T')[0]
}

function _compareDate(obj1: { frontMatter: { date: number } }, obj2: { frontMatter: { date: number } }) {
    return obj1.frontMatter.date < obj2.frontMatter.date ? 1 : -1
}

export { getPosts, API_HOST }
