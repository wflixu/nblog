# nblog

A CLI tool to build a static blog zip from Obsidian markdown files.

[Live Demo](http://blog.wflixu.cn)

## 简介

nblog 读取一个 **Obsidian 目录**，生成 **VitePress 静态站点**，默认在当前目录输出一个以源目录名命名的 zip 包。

博客内容继续保存在 Obsidian 中，本仓库只负责构建。已完全移除 Notion API 依赖；`notion` 只是内置主题名。

### 特性

- 📝 **Obsidian 语法支持** — Callout、Wikilink、图片嵌入、高亮语法自动转换
- 📦 **默认产出 zip** — 源目录名即 zip 名，方便上传部署
- 🎨 **双主题** — Notion 风格 / Claude Docs 风格
- 📂 **归档/分类/标签** — 自动按年归档、按分类和标签筛选
- 🔍 **全文搜索** — 内置 VitePress 本地搜索
- 📁 **嵌套目录展平** — 源目录可嵌套，输出统一平铺
- ⚡ **全局可用** — 安装后可在任意目录执行

## 快速开始

### 全局安装

```bash
npm install -g nblog

# 在任意目录执行，默认生成 ./blogs.zip
nblog build /path/to/your/obsidian/vault/blogs

# 指定输出目录，生成 ./out/blogs.zip
nblog build /path/to/obsidian/blogs -o ./out

# 指定 zip 文件名
nblog build /path/to/obsidian/blogs -o ./blog-2026.zip
```

### 从源码使用

```bash
git clone https://github.com/wflixu/nblog.git
cd nblog

pnpm install
pnpm build:cli

pnpm build    # 读取 nblog.config.json，生成 ./blogs.zip
pnpm dev      # 启动开发服务器
```

## 命令

### `nblog build [dir]`

从 Obsidian 目录构建静态博客。

| 选项 | 描述 |
|------|------|
| `-o, --output <path>` | zip 文件路径，或 zip 所在目录 |
| `--name <name>` | zip 基础名，默认取源目录名 |
| `--no-zip` | 不打包，直接输出静态目录 |
| `--title <title>` | 站点标题 |
| `--base <path>` | 基础 URL 路径 |
| `--description <desc>` | 站点描述 |
| `--hostname <hostname>` | 站点域名（生成 sitemap） |
| `--theme <theme>` | `notion` 或 `claude-docs` |

输出规则：

```
nblog build ~/vault/blogs
→ ./blogs.zip

nblog build ~/vault/blogs -o ~/Desktop/out
→ ~/Desktop/out/blogs.zip

nblog build ~/vault/blogs -o ~/Desktop/blog.zip
→ ~/Desktop/blog.zip

nblog build ~/vault/blogs --name weekly
→ ./weekly.zip

nblog build ~/vault/blogs --no-zip -o ./dist
→ ./dist/index.html ...
```

zip 内部是 `dist` 的**内容**，没有额外的 `dist/` 层：

```
index.html
404.html
sitemap.xml
posts/...
images/...
assets/...
```

### `nblog dev [dir]`

启动开发服务器，不产出 zip。

| 选项 | 描述 | 默认值 |
|------|------|--------|
| `--port <port>` | 开发服务器端口 | `5000` |
| `--title <title>` | 站点标题 | `My Blog` |
| `--base <path>` | 基础 URL 路径 | `/` |
| `--description <desc>` | 站点描述 | `A blog powered by nblog` |
| `--theme <theme>` | 主题名称 | `notion` |

> macOS 的「隔空播放接收器」默认占用 5000 端口。如果启动时报端口冲突，使用 `--port 5001`，或关闭「系统设置 → 通用 → 隔空播放与接力 → 隔空播放接收器」。

### `nblog init [dir]`

在当前目录生成 `nblog.config.json`。

## 配置

配置文件可选。查找顺序：

1. `--config <path>` 显式指定
2. 当前目录的 `nblog.config.json` 或 `.nblogrc`
3. `~/.config/nblog/config.json` 或 `~/.nblogrc`
4. 默认值

命令行参数优先于配置文件。

```json
{
  "source": "~/path/to/obsidian/blogs",
  "output": "dist",
  "name": "blogs",
  "title": "My Blog",
  "description": "A blog powered by nblog",
  "base": "/",
  "hostname": "https://blog.example.com",
  "theme": "notion",
  "port": 5000
}
```

| 字段 | 说明 |
|------|------|
| `source` | Obsidian 博客目录，支持绝对路径、相对路径和 `~` |
| `output` | zip 文件、zip 所在目录，或 `--no-zip` 时的输出目录 |
| `name` | zip 基础名，默认取源目录名 |
| `title` | 站点标题 |
| `description` | 站点描述 |
| `base` | 部署基础路径，域名根目录用 `/` |
| `hostname` | 站点域名，填了才生成 sitemap |
| `theme` | `notion` 或 `claude-docs` |
| `port` | 开发服务器端口 |

## 文章格式

发布文章必须包含 `title` 和 `published`：

```markdown
---
title: 我的文章标题
published: 2024-01-01
tags: [技术, Vue]
category: 前端
description: 文章简介
created: 2024-01-01T10:00
updated: 2024-01-02T11:00
---

文章内容...
```

### 属性说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | ✅ | 文章标题，不能为空 |
| `published` | ✅（发布时） | 发布日期 `YYYY-MM-DD`，也接受带时间的 ISO 字符串 |
| `tags` | ❌ | 标签数组 |
| `category` | ❌ | 单个分类 |
| `description` | ❌ | 首页摘要 |
| `created` | ❌ | 创建时间，Obsidian 维护 |
| `updated` | ❌ | 更新时间，Obsidian 维护 |

**发布规则：**

- 有 `published` 日期 → 构建，页面显示和排序使用该日期。
- 没有 `published` → 草稿，不构建。
- 不要使用 `published: true` / `false`。
- `title` 为空或缺失的文章会被跳过并打印警告。
- `created` / `updated` 可以没有，不影响构建。

## 支持的 Obsidian 语法

- `[!note]` / `[!tip]` / `[!warning]` 等 **Callout**
- `[[page]]` / `[[page|别名]]` **Wikilink**
- `![[image.png]]` / `![[note.md_assets/image.png|300]]` **图片嵌入**
- `==高亮文本==` **高亮**
- 代码块和行内代码会原样保留，不会被语法转换影响

## 图片

Obsidian 默认把文章图片放在文章旁边的 `{文章名}.md_assets/` 目录：

```
blogs/
├── 我的文章.md
└── 我的文章.md_assets/
    └── screenshot.png
```

构建时会：

- 递归复制资产目录中的图片到输出的 `public/images/`
- 文件名加上文章 slug 前缀：`{postSlug}__{原文件名}`
- 子目录用 `-` 展平，例如 `sub/pic.png` → `{postSlug}__sub-pic.png`
- 自动重写 Markdown 中的图片链接并做 URL 编码
- 引用了但找不到的图片会生成 1×1 占位图并打印警告

## 输出目录

源目录可以嵌套，但输出是平的：

```
源：
blogs/
├── tsdown 更好的库打包工具.md
└── 教程/
    └── iOS App 实战系列/
        └── 第一篇.md

输出：
posts/tsdown-更好的库打包工具.html
posts/教程-ios-app-实战系列-第一篇.html
images/...
```

嵌套路径会进入 slug；不同目录下的同名文件不会互相覆盖。

## 开发命令

```bash
pnpm install       # 安装依赖
pnpm build:cli     # 构建 CLI
pnpm dev:cli       # CLI 开发模式（watch）
pnpm dev           # 从 nblog.config.json 的 source 启动开发服务器
pnpm build         # 从 nblog.config.json 的 source 构建，生成 ./blogs.zip
```

## 部署

构建产物是纯静态文件：

```bash
pnpm build
# 或
nblog build /path/to/obsidian/blogs -o /tmp/blog
```

上传并解压到 nginx 站点目录：

```bash
scp blogs.zip ubuntu@your-server:/tmp/

# 服务器
sudo mv /var/www/blogs /var/www/blogs.bak.$(date +%F-%H%M) 2>/dev/null || true
sudo mkdir -p /var/www/blogs
sudo unzip -o /tmp/blogs.zip -d /var/www/blogs
sudo chown -R www-data:www-data /var/www/blogs
sudo nginx -t && sudo nginx -s reload
```

nginx 配置：

```nginx
root /var/www/blogs;
try_files $uri $uri.html $uri/ $uri/index.html =404;
```

`$uri.html` 用于让 `/posts/foo` 直接访问 `posts/foo.html`，避免刷新文章页 404。

## 项目结构

```
nblog/
├── nblog.config.json     # 内容目录 / 输出路径等配置
├── src/                  # CLI 源码
│   ├── cli.ts            # 入口（Commander 命令）
│   ├── scanner.ts        # 扫描 Obsidian、发布校验、slug 展平
│   ├── generate-config.ts # 生成构建目录、图片映射
│   ├── obsidian-transform.ts # Obsidian 语法转换
│   ├── config.ts         # 配置查找与解析
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
