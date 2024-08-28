import { useState } from 'react'
import { formatDatetime } from './../utils/util'
import { loadEnvConfig } from '@next/env'
import Link from 'next/link'

export default async function Page() {
  const apiHost = process.env.API_HOST
  const databaseId = process.env.DATABASE_ID
  const notionToken = process.env.NOTION_TOKEN
  const url = `${apiHost}/databases/${databaseId}/query`;
  console.log('api start', notionToken)


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
    console.log('api', data?.results ?? [])
    return data?.results ?? []
  }).catch(error => {
    console.log('apierror')
    console.error(error)
    return error
  })



  const getTitle = (item:any): string => {
    return item.properties.Title?.title[0]?.plain_text ?? ''
  }

  return (
    <section className="blocks">
      {results.map((item: any) => (
        <div className="block" key={item.id} >
          <h1 >
            <Link href={`/blog/${item.id}?title=${getTitle(item)}`}>{item.properties && item.properties.Title?.title[0]?.plain_text}</Link>
          </h1>
          <div className="footer">
            <span>{formatDatetime(item.last_edited_time)}</span>
          </div>
          {item.cover && (<div className="cover">
            <img src={item.cover.external.url} />
          </div>)}

        </div>
      ))}
    </section>
  )
}