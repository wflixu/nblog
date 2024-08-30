<script setup>
import { useData } from 'vitepress'

const { title,page , params } = useData()

</script>


<div class="page">
    <h1 class="title">{{ params.title }}</h1>
    <NContent :results="params.blocks"></NContent>
</div>











