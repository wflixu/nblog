# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 VitePress 和 Notion 的博客系统。Notion 作为 CMS 和编辑器，VitePress 作为静态站点生成器。

- Notion API 用于获取文章内容和元数据
- VitePress 用于渲染博客前端
- 文章页面通过动态路由 `posts/[id].md` 生成

## 环境变量配置

需要在 `.env` 或 `justfile` 中配置以下变量：

- `NOTION_TOKEN`: Notion API 认证令牌
- `DATABASE_ID`: Notion 数据库 ID（存储博客文章）
- `API_HOST`: Notion API 端点（默认: `https://api.notion.com/v1`）

## 开发命令

```bash
# 安装依赖
pnpm install
# 或
just inst

# 开发服务器（端口 5000）
pnpm dev
# 或
just dev

# 构建生产版本
pnpm build
# 或
just build

# 预览构建结果
pnpm preview
```

## 核心架构

### 构建工具

- 使用 pnpm 代替npm
- 使用just 运行命令 

### Notion 数据集成

[serverUtils.ts](.vitepress/theme/serverUtils.ts) 提供两个核心函数：

- `getPosts(pageSize)`: 从 Notion 数据库获取所有状态为"发布"的文章
  - 过滤条件：`properties.状态.select.equals = "发布"`
  - 排序：按 `Last edited time` 降序
  - 自动生成分页页面（每页 `pageSize` 篇文章）

- `getPageBlocks(pageId, last_edited_time)`: 获取文章的 Notion blocks 内容
  - 实现缓存机制：基于 `last_edited_time` 判断是否使用缓存
  - 缓存位置：`.vitepress/cache/{pageId}.json`
  - 自动下载并缓存 Notion 图片到 `public/assets/images/`

### VitePress 配置

[config.ts](.vitepress/config.ts) 关键配置：

- `transformPageData` 钩子：为 `posts/[id].md` 动态注入 Notion blocks 数据
- `themeConfig.posts`: 在构建时通过 `getPosts()` 预加载文章列表
- 分页配置：`pageSize = 10`（可调整）

### 自定义主题组件

[theme/index.ts](.vitepress/theme/index.ts) 扩展默认主题：

- **Layout 组件**: `NewLayout.vue`
- **页面组件**: `Page.vue`（首页列表）、`Archives.vue`、`Category.vue`、`Tags.vue`
- **Notion 内容渲染**: `NContent.vue` 递归渲染 Notion blocks
  - `NBlockOne`: 根 block 容器
  - `NBlockParagraph`: 段落
  - `NBlockHeading`: 标题
  - `NBlockCode`: 代码块
  - `NBlockImage`: 图片
  - `NBlockBullet`: 列表项
  - `NRichText`: 富文本内联样式

### 文章路由

- 首页：`/`（自动生成的 `index.md`）
- 分页：`/page_2.md`、`/page_3.md` 等（根据文章数量自动生成）
- 文章详情：`/posts/{notion_page_id}`，模板为 [posts/[id].md](posts/[id].md)
  - URL 参数：`id`（Notion page ID）、`last_edited_time`、`title`
  - `transformPageData` 将 Notion blocks 注入到 `page.blocks`

## Notion 数据库要求

Notion 数据库需要包含以下属性：

- `Title`: title 类型
- `状态`: select 类型（值为"发布"时才会显示）
- `Tags`: multi_select 类型
- `Category`: select 类型
- `Last edited time`: last_edited_time 类型（自动属性）

## 缓存策略

1. **文章列表**：构建时从 Notion API 获取并写入 `themeConfig.posts`
2. **文章内容**：按 pageId 缓存到 `.vitepress/cache/{pageId}.json`，根据 `last_edited_time` 判断是否更新
3. **图片**：下载到 `public/assets/images/{blockId}__{filename}`，URL 重写为 `/assets/images/{blockId}__{filename}`

## 注意事项

- 修改 `pageSize` 需要重新构建以重新生成分页页面
- Notion API 有速率限制，大量文章时注意缓存机制
- 图片下载是异步的（forEach），构建时可能需要等待或改用 Promise.all
- `transformPageData` 中的 JSON 修复逻辑（`fixInvalidJSON`）用于处理某些边缘情况
