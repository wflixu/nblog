<template>
  <blockquote class="quote-block">
    <NRichText v-for="rtext in props.rich_text" v-bind="rtext" :key="rtext.plain_text"></NRichText>
  </blockquote>
</template>

<script setup>
const props = defineProps({
  rich_text: Array,
  color: String
})
</script>

<style scoped>
.quote-block {
  border-left: 4px solid var(--vp-c-text-1);
  padding: 12px 16px;
  margin: 16px 0;
  background: var(--vp-c-bg-soft);
  font-style: italic;
}
</style>
