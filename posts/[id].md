<script setup>
import { useData } from 'vitepress'

const { title,page , params ,content } = useData()

// const blocks = JSON.parse(page.blocks)
</script>

<div class="page">
    <h1 class="title">{{ params.title }}</h1>
    <!-- <div>{{page.blocks}}</div> -->
    <NContent :results="page.blocks"></NContent>
</div>
















