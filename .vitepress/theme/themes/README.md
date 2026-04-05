# 主题配置

本项目支持两套主题，**构建时选择其一**：

## 选择主题

### 方式 1：修改 `custom.css`（推荐）

编辑 `.vitepress/theme/custom.css`：

```css
/* 使用 Notion 主题（默认） */
@import './themes/notion.css';
/* @import './themes/claude-docs.css'; */

/* 使用 Claude Code Docs 主题 */
/* @import './themes/notion.css'; */
@import './themes/claude-docs.css';
```

### 方式 2：使用环境变量

```bash
# 使用 Notion 主题（默认）
pnpm build

# 使用 Claude Code Docs 主题
VITE_THEME=claude-docs pnpm build
```

需要在 `custom.css` 中配置条件导入：

```css
@import './themes/base.css';

/* 根据环境变量选择主题 */
@import './themes/notion.css'; /* 默认 */
/* @import './themes/claude-docs.css'; */
```

## 主题特点

### Notion 主题
- 温暖的纸张质感
- 宽松的行高和间距
- 微妙的噪点纹理
- 柔和的阴影

### Claude Code Docs 主题
- 冷色中性色调
- 紧凑的布局
- 技术编辑器风格
- 高对比度

## 暗黑模式

两套主题都支持暗黑模式，通过 VitePress 内置的暗黑模式切换按钮控制。

暗黑模式的样式已经过优化，无需额外配置。
