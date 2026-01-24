import { promises as fs } from 'fs';
import { getDataSourceId, queryNotionDatabase } from '../.vitepress/theme/notionApi.js';


export default {
    async paths() {
        // 使用公共方法获取 data_source_id 和查询数据
        const dataSourceId = await getDataSourceId();
        const results = await queryNotionDatabase(dataSourceId);

        return results.map((pkg) => {
            const rawTitle = pkg.properties.Title?.title[0]?.plain_text ?? '未命名'
            // 清理标题：移除前后空格和特殊字符
            const title = rawTitle.trim()
            return {
                params: {
                    pkg: pkg.id,
                    id: pkg.id,
                    title,
                    last_edited_time: pkg.last_edited_time,
                }
            }
        })
    }
}