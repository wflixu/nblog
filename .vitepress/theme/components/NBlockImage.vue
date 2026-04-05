<template>
  <figure class="image-container">
    <img :src="href" alt="">
    <figcaption v-if="hasCaption" class="image-caption">
      <NRichText v-for="text in caption" :key="text.plain_text" v-bind="text"></NRichText>
    </figcaption>
  </figure>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: String,
  file: Object,
  caption: Object
})

const href = computed(() => {
  return props.file?.url || ''
})

const hasCaption = computed(() => {
  return props.caption && props.caption.rich_text && props.caption.rich_text.length > 0
})

const caption = computed(() => {
  return props.caption?.rich_text || []
})
</script>

<style scoped>
.image-container {
  margin: 24px 0;
  text-align: center;
}

.image-container img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.image-caption {
  margin-top: 8px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  text-align: center;
}
</style>
