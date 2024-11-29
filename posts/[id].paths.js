
import path from 'path';
import axios from 'axios';
import { promises as fs } from 'fs';

export default {
    async paths() {
        const apiHost = process.env.API_HOST
        const databaseId = process.env.DATABASE_ID
        const notionToken = process.env.NOTION_TOKEN
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
            console.error(error)
            return error
        })

        let pageBlock = {};

        for (const element of results) {
            const id = element.id
            const url = apiHost + `/blocks/${id}/children?page_size=1000`;
            let blocks = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${notionToken}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                }
            }).then(res => res.json()).then(data => {
                console.log('get blocks success for pageid', id)
                return data.results
            }).catch(error => {
                console.log('apierror')
                console.error(error)
                return error
            })
            const outputDir = 'public/assets/images'
            blocks.forEach(async (block) => {
                if(block.type == 'image') {
                    let originUrl = block?.image?.file?.url
                    if(!originUrl) {
                        return
                    }
                    const filename = path.basename(new URL(originUrl).pathname);
                    const cachedFileName = `${block.id}${filename}`;
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
            pageBlock[id] = blocks
        }

        return results.map((pkg) => {
            return {
                params: {
                    pkg: pkg.id,
                    id: pkg.id,
                    title: pkg.properties.Title?.title[0]?.plain_text ?? '888',
                    blocks: pageBlock[pkg.id]
                },
                page: {
                    title: pkg.properties.Title?.title[0]?.plain_text ?? '888',
                    blocks: pageBlock[pkg.id]
                }
            }
        })
    }
}