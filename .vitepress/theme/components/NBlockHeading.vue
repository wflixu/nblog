<template>
  <component :is="headingTag" class="heading-with-anchor" :id="anchorId">
    <span class="heading-text">
      <NRichText v-for="rtext in props.rich_text" v-bind="rtext" :key="rtext.plain_text"></NRichText>
    </span>
    <a :href="`#${anchorId}`" class="anchor-link" @click="copyLink" title="复制链接">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
    </a>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  level: String,
  rich_text: Array
})

const headingTag = computed(() => {
  if (props.level === 'heading_1') return 'h1'
  if (props.level === 'heading_2') return 'h2'
  if (props.level === 'heading_3') return 'h3'
  return 'h4'
})

// 生成锚点 ID
const anchorId = computed(() => {
  if (!props.rich_text || props.rich_text.length === 0) return 'heading'
  const text = props.rich_text.map(r => r.plain_text || '').join('')
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) || 'heading'
})

// 复制链接到剪贴板
const copyLink = async (e) => {
  e.preventDefault()
  const url = window.location.origin + window.location.pathname + `#${anchorId.value}`
  try {
    await navigator.clipboard.writeText(url)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}
</script>

<style scoped>
.heading-with-anchor {
  position: relative;
  display: flex;
  align-items: center;
  scroll-margin-top: 80px;
}

.heading-text {
  flex: 1;
}

.anchor-link {
  opacity: 0;
  margin-left: 8px;
  color: var(--vp-c-text-3);
  transition: opacity 0.2s ease, color 0.2s ease;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.heading-with-anchor:hover .anchor-link {
  opacity: 1;
}

.anchor-link:hover {
  color: var(--vp-c-brand);
}

h1 {
  color: var(--vp-c-text-1);
  font-size: 1.7em;
}

h2 {
  color: var(--vp-c-text-1);
  font-size: 1.4em;
}

h3 {
  color: var(--vp-c-text-2);
  font-size: 1.2em;
}
</style>
