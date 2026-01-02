<template>
  <div class="numbered-item">
    <NRichText v-for="rtext in props.rich_text" v-bind="rtext" :key="rtext.plain_text"></NRichText>
  </div>
</template>

<script setup>
const props = defineProps({
  rich_text: Array,
  color: String
})
</script>

<style scoped>
.numbered-item {
  position: relative;
  padding-left: 24px;
  margin: 8px 0;
  counter-increment: numbered-counter;
}

.numbered-item::before {
  content: counter(numbered-counter) ".";
  position: absolute;
  left: 0;
  top: 0;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
</style>
