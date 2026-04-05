<script setup>
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'
import PostMeta from '../.vitepress/theme/components/PostMeta.vue'

const { page } = useData()
const blocks = ref([])
const loading = ref(true)

onMounted(async () => {
    const pageId = page.value.params.id
    const blocksPath = `/blocks-data/${pageId}.json`

    try {
        const response = await fetch(blocksPath)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const jsonText = await response.text()
        blocks.value = JSON.parse(jsonText)
    } catch (error) {
        console.error('Failed to load blocks for', pageId, ':', error)
    } finally {
        loading.value = false
    }
})
</script>

<div class="page">
    <h1 class="title">{{ page.params.title }}</h1>
    <PostMeta />
    <div v-if="loading" class="loading">加载中...</div>
    <NContent v-else-if="blocks.length > 0" :results="blocks"></NContent>
    <div v-else class="error">无法加载文章内容</div>
</div>
















