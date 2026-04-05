<template>
  <div class="home-page">
    <!-- 文章列表 -->
    <div v-for="(article, index) in displayedPosts" :key="article.regularPath" class="post-list">
      <div class="post-header">
        <div class="post-title">
          <a :href="withBase(article.regularPath)"> {{ article.frontMatter.title }}</a>
        </div>
      </div>
      <p class="describe" v-html="article.frontMatter.description"></p>
      <div class='post-info'>
        {{ article.frontMatter.date }}
        <span v-if="article.frontMatter.category" class="category">
          <a :href="withBase(`/pages/category.html?category=${article.frontMatter.category}`)">
            {{ article.frontMatter.category }}
          </a>
        </span>
        <span v-for="item in article.frontMatter.tags" :key="item" class="tag">
          <a :href="withBase(`/pages/tags.html?tag=${item}`)"> {{ item }}</a>
        </span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <span>加载中...</span>
    </div>

    <!-- 没有更多数据 -->
    <div v-else-if="!hasMore" class="no-more">
      <span>没有更多文章了</span>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-state">
      <span>加载失败，请刷新重试</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { withBase } from 'vitepress'
import { useData } from 'vitepress'

interface Article {
  regularPath: string
  frontMatter: {
    title: string
    description: string
    date: string
    tags: string[]
    category?: string
  }
}

const { theme } = useData()
const allPosts = computed(() => theme.value.posts || [])

// 状态管理
const currentPage = ref(1)
const pageSize = 10
const loading = ref(false)
const error = ref(false)
const hasMore = computed(() => {
  return displayedPosts.value.length < allPosts.value.length
})

// 显示的文章列表
const displayedPosts = ref<Article[]>([])

// 节流处理
let throttleTimer: ReturnType<typeof setTimeout> | null = null

// 加载更多文章
function loadMore() {
  if (loading.value || !hasMore.value) return

  loading.value = true
  error.value = false

  // 使用 setTimeout 模拟异步，添加小延迟提升体验
  setTimeout(() => {
    try {
      const start = displayedPosts.value.length
      const end = start + pageSize
      const newPosts = allPosts.value.slice(start, end)

      displayedPosts.value.push(...newPosts)
      currentPage.value++
      loading.value = false
    } catch (err) {
      console.error('Load more error:', err)
      error.value = true
      loading.value = false
    }
  }, 300)
}

// 滚动处理（带节流）
function handleScroll() {
  if (throttleTimer) return

  throttleTimer = setTimeout(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    // 距离底部 200px 时触发加载
    if (scrollTop + windowHeight >= documentHeight - 200) {
      loadMore()
    }

    throttleTimer = null
  }, 200)
}

// 初始加载
onMounted(() => {
  displayedPosts.value = allPosts.value.slice(0, pageSize)

  // 添加滚动监听
  window.addEventListener('scroll', handleScroll)
})

// 清理监听器
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (throttleTimer) {
    clearTimeout(throttleTimer)
  }
})
</script>

<style scoped>
.post-list {
  border-bottom: 1px dashed var(--vp-c-divider-light);
  padding: 14px 0 14px 0;
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.post-title {
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0.1rem 0;
}

.describe {
  font-size: 0.9375rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  color: var(--vp-c-text-2);
  margin: 10px 0;
  line-height: 1.5rem;
}

.post-info {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.post-info a {
  color: var(--vp-c-brand);
  text-decoration: none;
}

.post-info a:hover {
  text-decoration: underline;
}

.post-info .category a {
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
}

.post-info .category a:hover {
  color: var(--vp-c-brand);
}

.post-info .tag a {
  color: var(--vp-c-brand);
  font-size: 0.85rem;
  padding: 2px 6px;
  background-color: var(--vp-c-bg-soft);
  border-radius: 4px;
}

.post-info .tag a:hover {
  background-color: var(--vp-c-brand);
  color: white;
}

/* 状态样式 */
.loading-state,
.no-more,
.error-state {
  text-align: center;
  padding: 20px;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.error-state {
  color: var(--vp-c-danger);
}

@media screen and (max-width: 768px) {
  .post-list {
    padding: 14px 0 14px 0;
  }

  .post-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .post-title {
    font-size: 1.0625rem;
    font-weight: 400;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    width: 17rem;
  }

  .describe {
    font-size: 0.9375rem;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    margin: 0.5rem 0 1rem;
  }
}
</style>
