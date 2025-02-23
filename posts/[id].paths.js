import path from 'path';
import axios from 'axios';
import { promises as fs } from 'fs';


export default {
    async paths() {
        const apiHost = process.env.API_HOST
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
            console.error(error)
            return error
        })

        return results.map((pkg) => {
            return {
                params: {
                    pkg: pkg.id,
                    id: pkg.id,
                    title: pkg.properties.Title?.title[0]?.plain_text ?? '888',
                    last_edited_time: pkg.last_edited_time,
                }
            }
        })
    }
}