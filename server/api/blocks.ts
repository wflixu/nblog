

export default defineEventHandler(async (event) => {

    const id = getQuery(event).id

    const url = import.meta.env.VITE_API_HOST + `/blocks/${id}/children?page_size=100`;

    const notionToken = import.meta.env.VITE_NOTION_TOKEN

    return new Promise((resolve, reject) => {


        console.log('api', url)
        console.log('token', notionToken)
        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${notionToken}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            }
        }).then(res => res.json()).then(data => {
            console.log('api', data)
            resolve(data)
        }).catch(error => {
            console.log('apierror')
            console.error(error)
            reject(error)
        })
    })
})