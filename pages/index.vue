<template>
  <section class="blocks">
    <div class="block" v-for="item in data" :key="item.id" @click="onDetail(item)">
      <h1 v-if="item.properties">
        {{ item.properties.Title?.title[0]?.plain_text }}
      </h1>
      <div class="footer">
        <Icon name="fluent-mdl2:date-time-2" style="color: black" size="1.5em" />
        <span>{{ formatDatetime(item.last_edited_time) }}</span>
      </div>
      <div v-if="item.cover" class="cover">
        <NuxtImg :src="item.cover.external.url"  />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">


const { data, status } = await useFetch<any>('/api/pages', { timeout: 300000 })

const onDetail = async (artcle) => {
  let id = artcle.id;
  window.localStorage.setItem('reading', artcle.properties.Title?.title[0]?.plain_text?? '')
  await navigateTo({ path: `/post/${id}` })
}



</script>


<style scoped>
.blocks {
  margin: 24px; 
  display: grid;
  gap: 24px 32px;
  justify-content: center;
  /* grid 每行 4平分，宽度最小是280px */
  grid-template-columns: repeat(3, minmax(280px, 400px));

}

.block {
  height: 220px;
  border-radius: 4px;
  box-shadow: 0 0 5px #ddd;
  position: relative;

  &:hover {
    cursor: pointer;
    box-shadow: 0 0 8px #aaa;
  }

  .cover {
    position: absolute;
    z-index: -1;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    filter: blur(2px) opacity(0.2);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;

    }
  }

  .footer {
    background-color: white;
    position: absolute;
    border-top:  1px solid #ddd;
    bottom: 0;
    left: 0;
    right: 0;
    height: 32px;
    display: flex;
    align-items: center;
    font-size: 12px;
    padding: 0 16px;
    gap: 8px;
  }

  h1 {
    padding: 0 32px;
    font-size: 22px;
    word-break: break-all;        /* 强制在长单词中断行 */
    overflow-wrap: break-word;    /* 在必要时断行以防止溢出 */
    line-height: 1.5;   
  }
}
</style>
