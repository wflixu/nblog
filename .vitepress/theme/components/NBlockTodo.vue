<template>
  <div class="todo-item">
    <input
      type="checkbox"
      :checked="props.checked"
      disabled
      class="todo-checkbox"
    >
    <span class="todo-text" :class="{ checked: props.checked }">
      <NRichText v-for="rtext in props.rich_text" v-bind="rtext" :key="rtext.plain_text"></NRichText>
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  rich_text: Array,
  checked: Boolean,
  color: String
})
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 8px 0;
}

.todo-checkbox {
  margin-top: 4px;
  cursor: not-allowed;
}

.todo-text.checked {
  text-decoration: line-through;
  opacity: 0.6;
}
</style>
