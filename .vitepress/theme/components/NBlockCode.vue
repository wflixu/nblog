<template>
  <div class="vp-code" v-html="htmlStr"></div>
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

const code = props.rich_text.reduce((prev, cur) => {
  return prev + cur.plain_text
}, "")

// 渲染代码高亮的函数
const renderCode = async () => {
  const theme = isDark.value ? 'github-dark' : 'github-light'

  const html = await codeToHtml(code, {
    lang: props.language || 'text',
    theme
  })

  // 包装在 div 中以匹配 VitePress 结构
  htmlStr.value = `<div class="language-${props.language || 'text'}"><span class="lang">${props.language || 'text'}</span>${html}</div>`
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
.vp-code {
  margin: 16px 0;
  border-radius: 8px;
}

.vp-code :deep(.language-text) {
  display: block;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider-light);
  border-radius: 8px;
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