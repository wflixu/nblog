<template>
   <div class="bullet-item">
      <NRichText v-for="rtext in props.rich_text" v-bind="rtext"></NRichText>
   </div>
</template>

<script setup>

const props = defineProps({
   rich_text: Array,
})

</script>

<style scoped>
.bullet-item {
   position: relative;
   padding-left: 24px;
    &::before {
      content: '';
      /* 伪元素内容为空 */
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 8px;
      /* 圆点直径 */
      height: 8px;
      /* 圆点直径 */
      background-color: #666;
      /* 圆点颜色 */
      border-radius: 50%;
      /* 圆形 */

   } 
}
</style>