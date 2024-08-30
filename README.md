# Blog powered by VitePress and Notion

[Live Demo](http://blog.wflixu.cn)

## 动机

之前用过很多的 blog 程序，比如 hexo,astro，nextjs 等，这些程序发布完成了，下次写blog就忘记了，一般在项目中写 markdown 文件，体验不好，自己以后总结和查看都不方便，一直想找一个编辑体验如 Notion Obsidian 的笔记软件，展示可以自定义样式，现在用 Vitepress + Notion ，终于实现了这个功能，Notion 作为 markdown 编辑器 和 blog CMS，Vitepress 作为博客渲染器，完美结合。


## 使用方法



1. 安装依赖 和 just 工具

```
npm install -g pnpm just

pnpm install

```


2. 在 justfile 中 配置 notion token 和 blog 用的 database ID




3. 执行 `just dev` 即可查看效果,


## 感谢

这个仓库是 根据 [airene vitepress-blog-pure](https://github.com/airene/vitepress-blog-pure) 改造的，原来是用本地md 文档管理博客，因为 vitpress 有SSG 的功能，改造成用Notion作为编辑端和管理端，vitepress 作为博客的渲染器，这样可以更好的管理博客文章，写博文是编辑体验更好。



