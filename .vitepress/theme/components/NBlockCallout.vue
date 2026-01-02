<template>
  <div class="callout-block" :class="`color-${props.color}`">
    <span v-if="iconEmoji" class="callout-icon">{{ iconEmoji }}</span>
    <div class="callout-content">
      <NRichText v-for="rtext in props.rich_text" v-bind="rtext" :key="rtext.plain_text"></NRichText>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rich_text: Array,
  color: String,
  icon: Object
})

const iconEmoji = computed(() => props.icon?.emoji)
</script>

<style scoped>
.callout-block {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin: 16px 0;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
}

.callout-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.callout-content {
  flex: 1;
}

.color-blue_background {
  background: #e3f2fd;
}

.color-green_background {
  background: #e8f5e9;
}

.color-yellow_background {
  background: #fffde7;
}

.color-red_background {
  background: #ffebee;
}

.color-gray_background {
  background: #f5f5f5;
}

.color-brown_background {
  background: #efebe9;
}

.color-orange_background {
  background: #fff3e0;
}

.color-pink_background {
  background: #fce4ec;
}

.color-purple_background {
  background: #f3e5f5;
}
</style>
