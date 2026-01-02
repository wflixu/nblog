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
  border: 1px solid var(--vp-c-divider-light);
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
  border-color: #90caf9;
}

.dark .color-blue_background {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.color-green_background {
  background: #e8f5e9;
  border-color: #81c784;
}

.dark .color-green_background {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.color-yellow_background {
  background: #fffde7;
  border-color: #fff59d;
}

.dark .color-yellow_background {
  background: rgba(234, 179, 8, 0.1);
  border-color: rgba(234, 179, 8, 0.3);
}

.color-red_background {
  background: #ffebee;
  border-color: #ef5350;
}

.dark .color-red_background {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.color-gray_background {
  background: #f5f5f5;
  border-color: #bdbdbd;
}

.dark .color-gray_background {
  background: rgba(120, 120, 120, 0.1);
  border-color: rgba(120, 120, 120, 0.3);
}

.color-brown_background {
  background: #efebe9;
  border-color: #bcaaa4;
}

.dark .color-brown_background {
  background: rgba(141, 110, 99, 0.1);
  border-color: rgba(141, 110, 99, 0.3);
}

.color-orange_background {
  background: #fff3e0;
  border-color: #ffb74d;
}

.dark .color-orange_background {
  background: rgba(249, 115, 22, 0.1);
  border-color: rgba(249, 115, 22, 0.3);
}

.color-pink_background {
  background: #fce4ec;
  border-color: #f06292;
}

.dark .color-pink_background {
  background: rgba(236, 72, 153, 0.1);
  border-color: rgba(236, 72, 153, 0.3);
}

.color-purple_background {
  background: #f3e5f5;
  border-color: #ba68c8;
}

.dark .color-purple_background {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.3);
}
</style>
