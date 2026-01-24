# Blog powered by VitePress and Notion
![](./public/favicon.svg)

[Live Demo](http://blog.wflixu.cn)

## 动机

之前用过很多的 blog 程序，比如 hexo,astro，nextjs 等，这些程序发布完成了，下次写blog就忘记了，一般在项目中写 markdown 文件，体验不好，自己以后总结和查看都不方便，一直想找一个编辑体验如 Notion Obsidian 的笔记软件，展示可以自定义样式，现在用 Vitepress + Notion ，终于实现了这个功能，Notion 作为 markdown 编辑器 和 blog CMS，Vitepress 作为博客渲染器，完美结合。


## 使用方法



### 1. 安装依赖

```bash
pnpm install
# 或
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env`，并填入你的 Notion API 配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
NOTION_TOKEN=ntn_xxxxxxxxxxxx
DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API_HOST=https://api.notion.com/v1
```

#### 获取 Notion API Token

1. 访问 [Notion Developers](https://www.notion.so/my-integrations)
2. 点击 "New integration" 创建一个新的集成
3. 复制 "Internal Integration Token"（格式：`ntn_...`）
4. 将其填入 `.env` 文件的 `NOTION_TOKEN`

#### 获取 Database ID

1. 在 Notion 中打开你的博客数据库
2. 从 URL 中复制 Database ID（32位字符）
3. 将其填入 `.env` 文件的 `DATABASE_ID`

#### ⚠️ 注意事项

- **永远不要**将 `.env` 文件提交到 Git
- `.env` 文件已经在 `.gitignore` 中，不会被提交
- 只提交 `.env.example` 作为模板

## Notion API 集成

本项目使用 **Notion API 2025-09-03** 版本，提供三个公共方法用于与 Notion 交互：

### 公共 API 方法

所有 API 方法位于 `.vitepress/theme/notionApi.js`：

#### 1. `getDataSourceId()` - 获取 Data Source ID

根据 Notion API 2025-09-03 升级，需要先获取 data_source_id：

```javascript
import { getDataSourceId } from './.vitepress/theme/notionApi.js'

const dataSourceId = await getDataSourceId()
// 返回: data_source_id (如果获取失败则返回 databaseId)
```

#### 2. `queryNotionDatabase(dataSourceId)` - 查询数据库文章

使用 data_source_id 查询已发布的文章：

```javascript
import { queryNotionDatabase } from './.vitepress/theme/notionApi.js'

const results = await queryNotionDatabase(dataSourceId)
// 返回: 文章数组（已过滤"状态=发布"的记录）
```

**查询条件：**
- `filter`: 状态 = "发布"
- `sorts`: Last edited time 降序

#### 3. `getPageBlocks(pageId)` - 获取页面 Blocks（支持分页）

自动分页获取页面的所有 blocks：

```javascript
import { getPageBlocks } from './.vitepress/theme/notionApi.js'

const blocks = await getPageBlocks(pageId)
// 返回: 所有 blocks 数组（自动处理分页）
```

**特性：**
- ✅ 自动分页：当 blocks 超过 1000 时自动请求下一页
- ✅ 使用 `next_cursor` 实现分页
- ✅ 直到 `has_more: false` 才停止

**分页示例：**
```
Fetched 100 blocks, fetching more... (total so far: 100)
Fetched 100 blocks, fetching more... (total so far: 200)
get blocks success for pageid xxx cached 154 blocks
```

### API 版本说明

- **API 版本**: `2025-09-03`
- **变更**: 使用 data sources 架构替代原有的 database 查询
- **兼容性**: 向后兼容，自动降级到 databaseId

## 接口

###

### 3. 启动开发服务器

```bash
pnpm run dev
# 或
npm run dev
```

### 4. 构建生产版本

```bash
pnpm run build
# 或
npm run build
```


## 感谢

这个仓库是 根据 [airene vitepress-blog-pure](https://github.com/airene/vitepress-blog-pure) 改造的，原来是用本地md 文档管理博客，因为 vitpress 有SSG 的功能，改造成用Notion作为编辑端和管理端，vitepress 作为博客的渲染器，这样可以更好的管理博客文章，写博文是编辑体验更好。

## 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

