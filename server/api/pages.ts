const url = `${import.meta.env.VITE_API_HOST}/databases/${import.meta.env.VITE_DATABASE_ID}/query`;
const notionToken = import.meta.env.VITE_NOTION_TOKEN;

export default defineEventHandler(async (event) => {
    console.log('api start', notionToken)
    return new Promise((resolve, reject) => {
        fetch(url, {
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
            console.log('api', data?.results ?? [])
            resolve(data?.results ?? [])
        }).catch(error => {
            console.log('apierror')
            console.error(error)
            reject(error)
        })
    })
    return ['test']
})