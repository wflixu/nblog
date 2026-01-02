
import fs from 'fs-extra'
import path, { resolve } from 'path'
import axios from 'axios';
import dotenv from 'dotenv';
import { parse, stringify } from 'flatted';

// 加载环境变量，明确指定 .env 文件路径
const envPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn('Warning: .env file not found or cannot be read. Please create .env file with NOTION_TOKEN, DATABASE_ID, and API_HOST.');
}

const apiHost = process.env.API_HOST || 'https://api.notion.com/v1'
const databaseId = process.env.DATABASE_ID;
const notionToken = process.env.NOTION_TOKEN;

// 验证必需的环境变量
if (!notionToken || !databaseId) {
    console.error('\n❌ Error: Missing required environment variables!');
    console.error('Please create a .env file in the project root with the following content:');
    console.error('  NOTION_TOKEN=your_notion_token');
    console.error('  DATABASE_ID=your_database_id');
    console.error('  API_HOST=https://api.notion.com/v1\n');
    throw new Error('Missing NOTION_TOKEN or DATABASE_ID in environment variables');
}

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
        try {
            let json = parse(await fs.readFile(cacheFilePath, 'utf-8'));
            // 确保 flatted 解析的结果是数组
            blocks = Array.isArray(json) ? json : [];

            // 验证缓存数据有效性
            if (blocks.length === 0) {
                console.warn('Cache is empty, will fetch from API');
                useCache = false;
            }
        } catch (error) {
            console.error('Cache parse error:', error);
            // 删除损坏的缓存
            await fs.remove(cacheFilePath).catch(() => {});
            useCache = false;
        }
    }

    if (!useCache) {
        const url = apiHost + `/blocks/${pageId}/children?page_size=1000`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${notionToken}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            blocks = data.results || [];

            // 只有在获取到有效数据时才写入缓存
            if (blocks.length > 0) {
                await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
                await fs.writeFile(cacheFilePath, stringify(blocks));
                console.log('get blocks success for pageid', pageId, `cached ${blocks.length} blocks`);
            } else {
                console.warn('No blocks found for page:', pageId);
            }
        } catch (error: any) {
            console.error('API request failed for page:', pageId);
            console.error('Error:', error.message);

            // 如果有旧缓存，尝试使用旧缓存
            try {
                const cachedData = await fs.readFile(cacheFilePath, 'utf-8');
                const json = parse(cachedData);
                if (Array.isArray(json) && json.length > 0) {
                    console.log('Using stale cache for page:', pageId);
                    blocks = json;
                }
            } catch (cacheError) {
                console.error('No cache available and API request failed');
                // 返回空数组而不是抛出错误，让构建继续
                blocks = [];
            }
        }
    }

    const outputDir = 'public/assets/images'
    blocks.forEach(async (block: any) => {
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


    // 不再生成静态分页文件，改用客户端无限滚动

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

function _convertDate(date = new Date().toString()) {
    const json_date = new Date(date).toJSON()
    return json_date.split('T')[0]
}

function _compareDate(obj1: { frontMatter: { date: number } }, obj2: { frontMatter: { date: number } }) {
    return obj1.frontMatter.date < obj2.frontMatter.date ? 1 : -1
}

export { getPosts }
