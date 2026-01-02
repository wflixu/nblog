<template>
  <div class="toggle-container">
    <div class="toggle-header" @click="isOpen = !isOpen">
      <span class="toggle-icon">{{ isOpen ? '▼' : '▶' }}</span>
      <NRichText v-for="rtext in props.rich_text" v-bind="rtext" :key="rtext.plain_text"></NRichText>
    </div>
    <div v-if="isOpen" class="toggle-content">
      <template v-for="child in props.children" :key="child.id">
        <NBlockOne v-bind="child"></NBlockOne>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  rich_text: Array,
  color: String,
  children: Array
})

const isOpen = ref(false)
</script>

<style scoped>
.toggle-container {
  margin: 12px 0;
  border: 1px solid var(--vp-c-divider-light);
  border-radius: 4px;
}

.toggle-header {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--vp-c-bg-soft);
}

.toggle-icon {
  font-size: 12px;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.toggle-content {
  padding: 12px;
  border-top: 1px solid var(--vp-c-divider-light);
}
</style>
