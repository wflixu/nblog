<script setup lang="ts">
const route = useRoute()
const id = route.params.id;
const blocks = ref([])

console.log("#####init pages ")


// const {data, status} = await useFetch<any>(`/api/blocks?id=${id}`, {timeout: 300000})
//   console.log('------', data.value, status.value)


const getPageDetail = () => {
  $fetch(`/api/blocks?id=${id}`, { timeout: 30000 }).then(res => {
    console.log(res)
    blocks.value = res.results;
  }).catch(err => {

  })
}

const title = computed(() => {
  if (import.meta.client) {
    return window.localStorage.getItem('reading') ?? ''
  }
  return ""
})

onMounted(() => {
  getPageDetail()
})


</script>
<template>
  <div class="page">
    <h1 class="title">{{ title }}</h1>
    <NContent :results="blocks"></NContent>
  </div>
</template>
<style scoped>
.page {
  line-height: 1.8;
  font-size: 18px;
  margin: 42px 10%;
  padding: 2% 8% 4% 8%;
  border: 1px solid LightGrey;

  .title {
    margin-bottom: 40px;
    border-bottom: 2px LightGrey solid;
    width: 98%;
    line-height: 150%;
    color: #333;
  }
}
</style>