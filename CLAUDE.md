# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## 项目概述

nblog 是一个把 **Obsidian 目录**构建成 **VitePress 静态博客 zip** 的 CLI 工具。

- 博客内容不存放在本仓库，继续保存在 Obsidian 中。
- 源目录通过命令行参数传入，或写在 `nblog.config.json` 的 `source`。
- 默认在**当前目录**生成 `<源目录名>.zip`。
- 本仓库只负责构建：CLI 源码在 `src/`，站点模板在 `template/`。
- 已完全移除 Notion API 依赖。`notion` 只是内置主题名。

## 常用命令

```bash
pnpm install
pnpm build:cli      # 构建 CLI -> cli-dist/cli.mjs
pnpm dev            # 读取配置，启动开发服务器
pnpm build          # 读取配置，生成 ./blogs.zip
pnpm nblog ...      # 直接调用 CLI
```

全局安装后可在任意目录运行：

```bash
nblog build /path/to/obsidian/blogs
nblog build /path/to/obsidian/blogs -o ./out
nblog build /path/to/obsidian/blogs --name weekly
nblog build /path/to/obsidian/blogs --no-zip -o ./dist
```

## 配置

配置文件可选。查找顺序：

1. `--config <path>`
2. 当前目录的 `nblog.config.json` 或 `.nblogrc`
3. `~/.config/nblog/config.json` 或 `~/.nblogrc`
4. 默认值

当前目录配置会覆盖用户级配置的同名字段。命令行参数优先于配置。

```json
{
  "source": "~/path/to/obsidian/blogs",
  "output": "dist",
  "name": "blogs",
  "title": "Today",
  "description": "vitepress,blog,blog-theme",
  "base": "/",
  "hostname": "https://blog.example.com",
  "theme": "notion",
  "port": 5000
}
```

- `output`：zip 文件路径、zip 所在目录，或 `--no-zip` 时的输出目录。
- `name`：zip 基础名，默认取源目录名。
- `hostname`：填了才生成 sitemap。

## 文章属性约定

发布文章必须有：

- `title`：非空字符串
- `published`：日期 `YYYY-MM-DD`，也接受带时间的 ISO 字符串

`published` 是**唯一的发布开关**：

- 有有效日期 → 构建，页面显示和排序都使用这个日期
- 没有 `published`、空值、`false` → 草稿，不构建
- 不支持 `published: true` / `false` 写法

可选属性：

- `tags`：YAML 数组
- `category`：单个字符串
- `description`：首页摘要
- `created` / `updated`：Obsidian 维护，读取并保留，但不参与发布判断，默认不展示

示例：

```markdown
---
title: 我的文章
published: 2024-01-01
tags: [技术, Vue]
category: 前端
description: 文章简介
created: 2024-01-01T10:00
updated: 2024-01-02T11:00
---
```

## 输出规则

- **源目录可以嵌套，输出必须平铺。**
- 嵌套路径进入 slug：
  `教程/iOS App 实战系列/第一篇.md` → `posts/教程-ios-app-实战系列-第一篇.md`
- 所有文章输出到 `posts/`，所有图片输出到 `public/images/`。
- 图片文件名格式：`{postSlug}__{原相对路径用 - 展平}`。
- 图片引用会做 URL 编码（空格、中文等）。
- 图片资产目录约定：`{文章名}.md_assets/`，支持子目录。
- 引用了但源目录不存在的图片会生成 1×1 占位图并打印警告。
- 同名文章 slug / 图片名冲突时追加源路径短 hash，保证构建结果可重复。
- zip 内部是 `dist` 的内容，没有额外的 `dist/` 层。

## 构建流程

1. 扫描 Obsidian 目录，按 `published` / `title` 过滤。
2. 在系统临时目录创建唯一构建目录（`os.tmpdir()/nblog-XXXX`）。
3. 复制 `template/`，写入 `package.json`（`"type": "module"`），生成文章和图片。
4. 在构建目录创建 `node_modules` 软链，指向包自带的 `node_modules`，保证全局安装 / 任意 cwd 下能解析 `vitepress` 和 `vue`。
5. VitePress 构建到 `buildDir/dist`。
6. 等待 sitemap 写流完成（VitePress 1.6 的 sitemap 写流不会 await）。
7. 用 `yazl` 把 `dist` 内容打包成 UTF-8 zip，或 `--no-zip` 时复制静态目录。
8. 无论成功失败都清理临时构建目录。

## 代码结构

- `src/cli.ts`：Commander 入口，build/dev/init；临时目录、zip、输出路径
- `src/scanner.ts`：扫描 Obsidian、校验 `published` / `title`、展平 slug、归一化 tags/category
- `src/generate-config.ts`：复制模板、生成 `posts-data.json`、生成文章 Markdown、图片映射与复制
- `src/obsidian-transform.ts`：callout、wikilink、图片嵌入、高亮、代码块保护
- `src/config.ts`：配置查找与解析
- `src/build.ts`：调用 VitePress `build` / `createServer`
- `template/.vitepress/`：站点配置和主题
- `bin/nblog.js` → `cli-dist/cli.mjs`

## 注意事项

- zip 使用 `yazl`，不要改回调用系统 `zip`：macOS 的 zip 会让中文文件名在 Linux 上乱码。
- 临时构建目录必须带 `node_modules` 软链，否则全局安装时解析不到 `vitepress`。
- 临时构建目录必须有 `"type": "module"` 的 `package.json`，否则 Vite 会用 CJS 加载配置并报 ESM-only 错误。
- `template/` 中统一使用 `frontMatter.published`，不要再引用 `frontMatter.date`。
- 修改 CLI 源码后执行 `pnpm build:cli`；`prepare` 脚本也会在安装/打包时自动构建。
- 不要自动执行 `git commit` / `git push`。
