import  NContent  from './NContent'


export default async function Page({ params, searchParams }: { params: { slug: string } , searchParams: {title:string} }) {

    const id = params.slug
    const apiHost = process.env.API_HOST
    const notionToken = process.env.NOTION_TOKEN
   

    const url = apiHost + `/blocks/${id}/children?page_size=100`;
    let blocks = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
        }
    }).then(res => res.json()).then(data => {
        console.log('api', data)
        return data.results
    }).catch(error => {
        console.log('apierror')
        console.error(error)
        return error
    })

    return (
        <div className="page">
            <h1 className="title">{searchParams.title}</h1>
            <NContent results={blocks}></NContent>
        </div>
    )


}