<template>
    <Layout>
        <template #doc-footer-before>
            <div class="post-info-wrapper" v-if="metaData && metaData.date">
                <div class="meta-line">
                    <span class="date-section">
                        <span class="date-label">时间：</span>
                        <span class="date">{{ metaData.date }}</span>
                        <span v-if="showEditedTime" class="edited-time">· 更新于 {{ metaData.last_edited_time?.substring(0, 10) }}</span>
                    </span>
                    <span class="divider">|</span>
                    <span class="category-section">
                        <span class="category-label">分类：</span>
                        <a v-if="metaData.category" :href="withBase(`/pages/category.html?category=${metaData.category}`)" class="category-link">{{ metaData.category }}</a>
                    </span>
                    <span class="divider">|</span>
                    <span class="tags-section">
                        <span class="tags-label">标签：</span>
                        <span class="tags-list">
                            <a
                                v-for="item in metaData.tags"
                                :key="item"
                                :href="withBase(`/pages/tags.html?tag=${item}`)"
                                class="tag-link"
                            >{{ item }}</a>
                        </span>
                    </span>
                </div>
            </div>
        </template>
    </Layout>
    <Copyright />
</template>
<script setup>
import DefaultTheme from 'vitepress/theme'
import Copyright from './Copyright.vue'
import { useData } from 'vitepress'
import { computed, onMounted } from 'vue'
import { withBase } from 'vitepress'

const { page } = useData()
const metaData = computed(() => page.value?.frontmatter || {})

// 只有当更新日期与发布日期不同时才显示更新日期
const showEditedTime = computed(() => {
    if (!metaData.value.last_edited_time) return false
    const date = metaData.value.date
    const editedTime = metaData.value.last_edited_time?.substring(0, 10)
    return date !== editedTime
})

const { Layout } = DefaultTheme

// 在页面加载后将 meta 信息移动到标题下方
onMounted(() => {
    setTimeout(() => {
        const metaInfo = document.querySelector('.post-info-wrapper')
        const title = document.querySelector('.vp-doc h1')
        if (metaInfo && title) {
            title.after(metaInfo)
        }
    }, 0)
})
</script>

<style>
.post-info-wrapper {
    margin: 0.5rem 0 1rem 0;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--vp-c-divider-light);
}

.meta-line {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--vp-c-text-2);
    font-size: 0.85rem;
    flex-wrap: wrap;
}

.date {
    color: var(--vp-c-text-2);
}

.date-label,
.category-label,
.tags-label {
    font-weight: 500;
    color: var(--vp-c-text-2);
    font-size: 0.85rem;
}

.edited-time {
    color: var(--vp-c-text-3);
    font-style: italic;
}

.divider {
    color: var(--vp-c-divider);
}

.category-section,
.tags-section {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.tags-list {
    display: inline-flex;
    gap: 0.4rem;
    flex-wrap: wrap;
}

.tag-link {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    background-color: var(--vp-c-bg-soft);
    border-radius: var(--vp-radius-small);
    font-size: 0.8rem;
    color: var(--vp-c-text-2);
    text-decoration: none;
    transition: all 0.2s ease;
    border: 1px solid var(--vp-c-divider-light);
    font-weight: 400;
}

.tag-link:hover {
    background-color: var(--vp-c-brand);
    color: white !important;
    border-color: var(--vp-c-brand);
    text-decoration: none;
}

.category-link {
    color: var(--vp-c-text-2);
    text-decoration: none;
    transition: color 0.2s ease;
}

.category-link:hover {
    color: var(--vp-c-brand);
    text-decoration: none;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
    .tag-link {
        background-color: var(--vp-c-bg-alt);
        color: var(--vp-c-text-2);
    }

    .tag-link:hover {
        color: white !important;
    }
}
</style>
