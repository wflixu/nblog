<template>
  <div class="theme-switch">
    <button
      class="theme-btn"
      :class="{ active: currentTheme === 'notion' }"
      @click="setTheme('notion')"
      title="Notion 风格"
    >
      <span class="theme-icon">N</span>
      <span class="theme-label">Notion</span>
    </button>
    <button
      class="theme-btn"
      :class="{ active: currentTheme === 'claude-docs' }"
      @click="setTheme('claude-docs')"
      title="Claude Docs 风格"
    >
      <span class="theme-icon">C</span>
      <span class="theme-label">Docs</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'nblog-theme'
const DEFAULT_THEME = 'notion'

const currentTheme = ref(DEFAULT_THEME)

// 从 localStorage 读取主题
function loadTheme() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved || DEFAULT_THEME
  }
  return DEFAULT_THEME
}

// 保存主题到 localStorage
function saveTheme(theme) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme)
  }
}

// 应用主题到 HTML 元素
function applyTheme(theme) {
  const html = document.documentElement
  // 移除旧主题类
  html.classList.remove('theme-notion', 'theme-claude-docs')
  // 添加新主题类
  html.classList.add(`theme-${theme}`)
}

// 设置主题
function setTheme(theme) {
  currentTheme.value = theme
  saveTheme(theme)
  applyTheme(theme)
  // 触发事件让其他组件知道主题已更改
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }))
}

// 初始化主题
onMounted(() => {
  currentTheme.value = loadTheme()
  applyTheme(currentTheme.value)
})
</script>

<style scoped>
.theme-switch {
  display: flex;
  gap: 4px;
  align-items: center;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--vp-radius-small);
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-btn:hover {
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.theme-btn.active {
  background-color: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: white;
}

.theme-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 2px;
  background-color: currentColor;
  opacity: 0.8;
}

.theme-label {
  font-size: 11px;
  font-weight: 500;
}

/* 移动端隐藏标签 */
@media (max-width: 768px) {
  .theme-label {
    display: none;
  }

  .theme-btn {
    padding: 6px;
  }
}
</style>
