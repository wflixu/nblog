<template>
  <div class="toggle-container">
    <div class="toggle-header">
      <span class="toggle-icon">▼</span>
      <span class="toggle-title">
        <NRichText v-for="rtext in props.rich_text" v-bind="rtext" :key="rtext.plain_text"></NRichText>
      </span>
    </div>
    <div class="toggle-content">
      <template v-for="child in props.children" :key="child.id">
        <NBlockOne v-bind="child"></NBlockOne>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rich_text: Array,
  color: String,
  children: Array
})
</script>

<style scoped>
.toggle-container {
  margin: 12px 0;
  border: 1px solid var(--vp-c-divider-light);
  border-radius: 4px;
}

.toggle-header {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--vp-c-bg-soft);
  font-weight: 500;
}

.toggle-icon {
  font-size: 10px;
  flex-shrink: 0;
  color: var(--vp-c-text-2);
}

.toggle-title {
  flex: 1;
  color: var(--vp-c-text-1);
}

.toggle-content {
  padding: 12px;
  border-top: 1px solid var(--vp-c-divider-light);
}
</style>
