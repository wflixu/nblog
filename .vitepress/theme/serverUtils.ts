
import fs from 'fs-extra'
import path, { resolve } from 'path'
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const apiHost = process.env.API_HOST
const databaseId = process.env.DATABASE_ID;
const notionToken = process.env.NOTION_TOKEN;

export async function getPageBlocks(pageId: string, last_edited_time: string) {
    console.log('getPageBlocks:', pageId)
    const cacheFilePath = path.join('.vitepress/cache', `${pageId}.json`);
    let useCache = false;

    try {
        const cacheStats = await fs.stat(cacheFilePath);
        const cacheModifiedTime = new Date(cacheStats.mtime);
        const elementModifiedTime = new Date(last_edited_time);

        if (cacheModifiedTime > elementModifiedTime) {
            useCache = true;
        }
    } catch (error) {
        // Cache file does not exist
    }

    let blocks = [];
    if (useCache) {
        blocks = JSON.parse(await fs.readFile(cacheFilePath, 'utf-8'));
    } else {
        const url = apiHost + `/blocks/${pageId}/children?page_size=1000`;
        blocks = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${notionToken}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            }
        }).then(res => res.json()).then(data => {
            console.log('get blocks success for pageid', pageId)
            return data.results
        }).catch(error => {
            console.log('apierror')
            console.error(error)
            return error
        });

        await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
        await fs.writeFile(cacheFilePath, JSON.stringify(blocks));
    }
    const outputDir = 'public/assets/images'
    blocks.forEach(async (block) => {
        if (block.type == 'image') {
            let originUrl = block?.image?.file?.url
            if (!originUrl) {
                return
            }
            const filename = path.basename(new URL(originUrl).pathname);
            const cachedFileName = `${block.id}__${filename}`;
            const outputPath = path.join(outputDir, cachedFileName);
            let isCached = await fs.access(outputPath).then(() => true).catch(() => false);
            if (isCached) {
                block.image.file.url = `/assets/images/${cachedFileName}`
                return;
            }
            try {
                const response = await axios.get(originUrl, { responseType: 'arraybuffer' });
                await fs.mkdir(outputDir, { recursive: true });
                await fs.writeFile(outputPath, response.data);

                console.log(`Downloaded image from ${block.id}: ${originUrl}`);

                block.image.file.url = `/assets/images/${block.id}${filename}`
            } catch (error) {
                console.error(`Failed to cache image: ${originUrl}`, error);
            }

        }
    });

    return blocks;
}



async function getPosts(pageSize: number) {
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
`
            const file = paths + `/page_${i}.md`
            await fs.writeFile(file, page.trim())
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

export { getPosts }
