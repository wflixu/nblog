import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
const envPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn('Warning: .env file not found or cannot be read.');
}

const apiHost = process.env.API_HOST || 'https://api.notion.com/v1'
const databaseId = process.env.DATABASE_ID;
const notionToken = process.env.NOTION_TOKEN;

/**
 * 根据 Notion API 2025-09-03 升级，获取 data_source_id
 * @returns {Promise<string>} data_source_id，如果获取失败则返回 databaseId
 */
export async function getDataSourceId() {
    let dataSourceId = databaseId; // 默认使用 databaseId 作为 data_source_id

    if (!notionToken || !databaseId) {
        console.warn('Missing NOTION_TOKEN or DATABASE_ID');
        return dataSourceId;
    }

    try {
        // Step 1: 获取 database 的 data_sources
        const dbResponse = await fetch(`${apiHost}/databases/${databaseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${notionToken}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2025-09-03'
            }
        });

        if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            if (dbData.data_sources && dbData.data_sources.length > 0) {
                // 使用第一个 data_source 的 ID
                dataSourceId = dbData.data_sources[0].id;
                console.log('Using data_source_id:', dataSourceId);
            }
        }
    } catch (error) {
        console.warn('Failed to fetch data_sources, using databaseId as fallback');
    }

    return dataSourceId;
}

/**
 * 使用 data_source_id 查询 Notion 数据库
 * @param {string} dataSourceId data_source_id 或 databaseId
 * @returns {Promise<any[]>} 查询结果数组
 */
export async function queryNotionDatabase(dataSourceId) {
    if (!notionToken || !dataSourceId) {
        console.error('Missing NOTION_TOKEN or dataSourceId');
        return [];
    }

    // Step 2: 使用 data_source_id 查询
    const url = `${apiHost}/data_sources/${dataSourceId}/query`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${notionToken}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2025-09-03'
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
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const results = data?.results ?? [];

        // 调试日志
        console.log('Query results count:', results.length);
        if (results.length > 0) {
            console.log('First result status:', results[0].properties?.状态?.select?.name ?? 'No status');
        }

        return results;
    } catch (error) {
        console.error('Query error:', error.message);
        return [];
    }
}

/**
 * 获取页面的所有 blocks（支持分页）
 * @param {string} pageId Notion 页面 ID
 * @returns {Promise<any[]>} 所有 blocks 数组
 */
export async function getPageBlocks(pageId) {
    if (!notionToken || !pageId) {
        console.error('Missing NOTION_TOKEN or pageId');
        return [];
    }

    let allBlocks = [];
    let nextCursor = null;
    let hasMore = true;

    try {
        // 分页获取所有 blocks
        while (hasMore) {
            let url;
            if (nextCursor) {
                url = `${apiHost}/blocks/${pageId}/children?page_size=1000&start_cursor=${encodeURIComponent(nextCursor)}`;
            } else {
                url = `${apiHost}/blocks/${pageId}/children?page_size=1000`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${notionToken}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2025-09-03'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const results = data.results || [];

            allBlocks.push(...results);

            // 检查是否还有更多数据
            hasMore = data.has_more || false;
            nextCursor = data.next_cursor || null;

            if (hasMore) {
                console.log(`Fetched ${results.length} blocks, fetching more... (total so far: ${allBlocks.length})`);
            }
        }

        return allBlocks;
    } catch (error) {
        console.error('Failed to fetch blocks for page:', pageId);
        console.error('Error:', error.message);
        return [];
    }
}

