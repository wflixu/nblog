<template>
  <a :href="props.url" target="_blank" class="bookmark-card">
    <div class="bookmark-icon">🔖</div>
    <div class="bookmark-info">
      <div v-if="captionText" class="bookmark-title">{{ captionText }}</div>
      <div class="bookmark-url">{{ cleanUrl }}</div>
    </div>
  </a>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  caption: Array,
  url: String
})

const captionText = computed(() => {
  return props.caption?.[0]?.plain_text || props.url
})

const cleanUrl = computed(() => {
  try {
    const url = new URL(props.url)
    return url.hostname
  } catch {
    return props.url
  }
})
</script>

<style scoped>
.bookmark-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin: 12px 0;
  border: 1px solid var(--vp-c-divider-light);
  border-radius: 6px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: all 0.2s;
}

.bookmark-card:hover {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-bg-soft);
}

.bookmark-icon {
  font-size: 24px;
}

.bookmark-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.bookmark-url {
  font-size: 12px;
  color: var(--vp-c-text-2);
}
</style>
