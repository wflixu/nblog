<script setup>
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()
const blocks = ref([])
const loading = ref(true)

onMounted(async () => {
    // 从 page.params 获取参数
    const pageId = page.value.params.id
    const blocksPath = `/blocks-data/${pageId}.json`

    console.log('Loading blocks for:', pageId, 'from:', blocksPath)

    try {
        const response = await fetch(blocksPath)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const jsonText = await response.text()
        blocks.value = JSON.parse(jsonText)
        console.log('Loaded blocks:', blocks.value.length)
    } catch (error) {
        console.error('Failed to load blocks for', pageId, ':', error)
    } finally {
        loading.value = false
    }
})
</script>

<div class="page">
    <h1 class="title">{{ page.params.title }}</h1>
    <div v-if="loading" class="loading">加载中...</div>
    <NContent v-else-if="blocks.length > 0" :results="blocks"></NContent>
    <div v-else class="error">无法加载文章内容</div>
</div>
















