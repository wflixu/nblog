# nblog

A CLI tool to build beautiful blogs from Obsidian markdown files.

[Live Demo](http://blog.wflixu.cn)

## 简介

nblog 是一个基于 Obsidian + VitePress 的博客构建工具。你可以在 Obsidian 中写文章（Markdown），然后通过 nblog CLI 生成静态博客站点。

### 特性

- 📝 **Obsidian 语法支持** — Callout、Wikilink、图片嵌入、高亮语法自动转换
- 🎨 **双主题切换** — Notion 风格 / Claude Docs 风格，客户端实时切换
- 📂 **归档/分类/标签** — 自动按年归档、按分类和标签筛选
- 🔍 **全文搜索** — 内置 VitePress 本地搜索
- ⚡ **快速构建** — 基于 VitePress SSG，生成静态 HTML

## 快速开始

### 安装

```bash
npm install -g nblog
```

或者从源码使用：

```bash
# 克隆项目
git clone https://github.com/wflixu/nblog.git
cd nblog

# 安装依赖
pnpm install

# 构建 CLI
pnpm build:cli
```

### 使用

```bash
# 从 Obsidian 目录构建静态站点
nblog build /path/to/your/obsidian/vault/blogs

# 指定输出目录
nblog build ./blogs -o ./dist

# 启动开发服务器
nblog dev ./blogs --port 5000
```

### 文章格式

你的 Obsidian 文章需要包含 `title` 和 `published` 的 frontmatter：

```markdown
---
title: 我的文章标题
published: 2024-01-01
tags: [技术, Vue]
category: 前端
description: 文章简介
---

文章内容...
```

#### 标准字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | ✅ | 文章标题 |
| `published` | ✅ | 发布日期，格式 `YYYY-MM-DD` |
| `tags` | ❌ | 标签，数组或逗号分隔 |
| `category` | ❌ | 分类 |
| `description` | ❌ | 文章简介 |

### 支持的 Obsidian 语法

- `[!note]` / `[!tip]` / `[!warning]` 等 **Callout** 语法
- `[[page]]` / `[[page|别名]]` **Wikilink**
- `![[image.png]]` **图片嵌入**
- `==高亮文本==` **高亮语法**

## 命令

### `nblog build <dir>`

从 Obsidian 目录构建静态站点。

| 选项 | 描述 | 默认值 |
|------|------|--------|
| `-o, --output <dir>` | 输出目录 | `./dist` |
| `--title <title>` | 站点标题 | `My Blog` |
| `--base <path>` | 基础 URL 路径 | `/` |
| `--description <desc>` | 站点描述 | `A blog powered by nblog` |
| `--hostname <hostname>` | 站点域名（启用 sitemap） | - |
| `--theme <theme>` | 主题名称 (`notion` 或 `claude-docs`) | `notion` |

### `nblog dev <dir>`

启动开发服务器。

| 选项 | 描述 | 默认值 |
|------|------|--------|
| `--port <port>` | 开发服务器端口 | `5000` |
| `--title <title>` | 站点标题 | `My Blog` |
| `--base <path>` | 基础 URL 路径 | `/` |
| `--description <desc>` | 站点描述 | `A blog powered by nblog` |
| `--theme <theme>` | 主题名称 | `notion` |

## 开发命令

```bash
pnpm install       # 安装依赖
pnpm build:cli     # 构建 CLI
pnpm dev:cli       # 开发模式（watch）
pnpm dev           # VitePress 开发服务器
pnpm build         # VitePress 构建
```

## 主题

内置两套主题，可以通过页面右上角的主题切换按钮实时切换：

- **Notion 风格** — 极简、宽松留白、纸质质感
- **Claude Docs 风格** — 技术精致主义、高对比度

也可以通过 CLI 设置默认主题：

```bash
nblog build ./blogs --theme claude-docs
```

## 项目结构

```
nblog/
├── src/                  # CLI 源码
│   ├── cli.ts            # 入口（Commander 命令）
│   ├── scanner.ts        # 扫描 Obsidian Markdown
│   ├── generate-config.ts # 生成构建目录
│   ├── obsidian-transform.ts # Obsidian 语法转换
│   └── build.ts          # VitePress 构建/开发
├── template/             # 博客模板
│   └── .vitepress/
│       ├── config.ts     # VitePress 配置
│       └── theme/        # 主题组件和样式
├── bin/nblog.js          # CLI 入口文件
├── tsdown.config.ts      # CLI 构建配置
└── cli-dist/             # 构建产物
```

## 感谢

- [VitePress](https://vitepress.vuejs.org/) — 静态站点生成器
- [airene/vitepress-blog-pure](https://github.com/airene/vitepress-blog-pure) — 博客主题灵感

## 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。
