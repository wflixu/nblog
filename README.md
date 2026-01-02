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

