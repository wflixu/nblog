<template>
  <div class="post-meta" v-if="metaData && metaData.date">
    <span class="meta-item">
      <span class="meta-label">时间：</span>
      <span class="meta-value">{{ metaData.date }}</span>
    </span>
    <span class="divider">|</span>
    <span class="meta-item">
      <span class="meta-label">分类：</span>
      <a v-if="metaData.category" :href="withBase(`/pages/category.html?category=${metaData.category}`)" class="meta-link">
        {{ metaData.category }}
      </a>
    </span>
    <span class="divider">|</span>
    <span class="meta-item">
      <span class="meta-label">标签：</span>
      <span class="tags-wrapper">
        <a
          v-for="tag in metaData.tags"
          :key="tag"
          :href="withBase(`/pages/tags.html?tag=${tag}`)"
          class="meta-tag"
        >{{ tag }}</a>
      </span>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { page } = useData()
const metaData = computed(() => page.value?.frontmatter || {})
</script>

<style scoped>
.post-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  margin: 0.5rem 0 1rem 0;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--vp-c-divider-light);
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.meta-label {
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.meta-value {
  color: var(--vp-c-text-2);
}

.divider {
  color: var(--vp-c-divider);
}

.meta-link {
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.2s ease;
}

.meta-link:hover {
  color: var(--vp-c-brand);
  text-decoration: none;
}

.tags-wrapper {
  display: inline-flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.meta-tag {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: var(--vp-radius-small);
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid var(--vp-c-divider-light);
}

.meta-tag:hover {
  background-color: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
  text-decoration: none;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .meta-tag {
    background-color: var(--vp-c-bg-alt);
  }

  .meta-tag:hover {
    color: white;
  }
}
</style>
