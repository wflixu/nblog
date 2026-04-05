<template>
  <div class="code-container">
    <div class="code-header">
      <span class="code-language">{{ props.language || 'text' }}</span>
      <button class="copy-button" @click="copyCode" :class="{ copied: isCopied }">
        <span v-if="!isCopied" class="copy-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </span>
        <span v-else class="copied-text">已复制</span>
      </button>
    </div>
    <div class="vp-code" v-html="htmlStr"></div>
  </div>
</template>

<script setup>
import { codeToHtml } from 'shiki'
import { ref, watch, onMounted } from 'vue'
import { useData } from 'vitepress'

const props = defineProps({
  rich_text: Array,
  language: String
})

const { isDark } = useData()
const htmlStr = ref("")
const isCopied = ref(false)

const code = props.rich_text.reduce((prev, cur) => {
  return prev + cur.plain_text
}, "")

// 渲染代码高亮的函数
const renderCode = async () => {
  const theme = isDark.value ? 'github-dark' : 'github-light'
  // Notion API 返回的 language 是 "plain text"，shiki 不支持，需要转换为 "text"
  const lang = props.language === 'plain text' ? 'text' : (props.language || 'text')

  const html = await codeToHtml(code, {
    lang,
    theme
  })

  // 包装在 div 中以匹配 VitePress 结构
  htmlStr.value = `<div class="language-${lang}"><span class="lang">${lang}</span>${html}</div>`
}

// 复制代码
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(code)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}

// 初始渲染
onMounted(() => {
  renderCode()
})

// 监听主题变化
watch(isDark, () => {
  renderCode()
})
</script>

<style scoped>
.code-container {
  margin: 16px 0;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider-light);
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider-light);
}

.code-language {
  font-size: 12px;
  color: var(--vp-c-text-2);
  font-weight: 500;
  text-transform: uppercase;
}

.copy-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--vp-c-divider-light);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--vp-c-text-2);
}

.copy-button:hover {
  background-color: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
}

.copy-button.copied {
  background-color: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.copy-icon {
  display: flex;
  align-items: center;
}

.copied-text {
  font-size: 12px;
  font-weight: 500;
}

.vp-code {
  margin: 0;
  border-radius: 0;
}

.vp-code :deep(.language-text) {
  display: block;
  background-color: var(--vp-c-bg);
  border: none;
  border-radius: 0;
  overflow-x: auto;
}

.vp-code :deep(.lang) {
  display: none;
}

.vp-code :deep(pre) {
  margin: 0;
  padding: 16px;
  background: transparent;
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 14px;
  overflow-x: auto;
}

.vp-code :deep(code) {
  display: block;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: var(--vp-c-text-1);
}
</style>
