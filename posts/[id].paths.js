
import apiConfig from '../api.config'

export default {
    async paths() {
        const apiHost = apiConfig.API_HOST
        const databaseId = apiConfig.DATABASE_ID
        const notionToken = apiConfig.NOTION_TOKEN
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
            const url = apiHost + `/blocks/${id}/children?page_size=100`;
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
            pageBlock[id] = blocks
        }

        return results.map((pkg) => {
            return {
                params: {
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