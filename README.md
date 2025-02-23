# Blog powered by VitePress and Notion
![](./public/favicon.svg)

[Live Demo](http://blog.wflixu.cn)

## 动机

之前用过很多的 blog 程序，比如 hexo,astro，nextjs 等，这些程序发布完成了，下次写blog就忘记了，一般在项目中写 markdown 文件，体验不好，自己以后总结和查看都不方便，一直想找一个编辑体验如 Notion Obsidian 的笔记软件，展示可以自定义样式，现在用 Vitepress + Notion ，终于实现了这个功能，Notion 作为 markdown 编辑器 和 blog CMS，Vitepress 作为博客渲染器，完美结合。


## 使用方法



### 1. 安装依赖 

```
pnpm install
npm install

# 可选 ，如果用just 命令，先安装
npm install -g pnpm just

```

### 2. 配置环境变量  NOTION_TOKEN、DATABASE_ID、API_HOST
在.env 或 justfile 文件中配置 NOTION_TOKEN、DATABASE_ID、API_HOST
```
# justfile
set export
NOTION_TOKEN := "your token"
DATABASE_ID := "your base id"
API_HOST := "https://api.notion.com/v1"

# .env
NOTION_TOKEN="your token"
DATABASE_ID="your base id"
API_HOST="https://api.notion.com/v1"
```


### 3. 执行 `just dev` 或 `pnpm dev` 即可查看效果,

### 4. 构建 `just build` 或 `pnpm build`


## 感谢

这个仓库是 根据 [airene vitepress-blog-pure](https://github.com/airene/vitepress-blog-pure) 改造的，原来是用本地md 文档管理博客，因为 vitpress 有SSG 的功能，改造成用Notion作为编辑端和管理端，vitepress 作为博客的渲染器，这样可以更好的管理博客文章，写博文是编辑体验更好。



