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
  margin: 4px 0;
}

.bullet-item::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 14px;
  width: 6px;
  height: 6px;
  background-color: var(--vp-c-text-2);
  border-radius: 50%;
}
</style>