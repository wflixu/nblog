<template>
  <div class="table-container">
    <table class="notion-table">
      <tbody>
        <template v-for="row in props.table_rows" :key="row.id">
          <NBlockTableRow :cells="row.cells"></NBlockTableRow>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  table_rows: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.table-container {
  margin: 16px 0;
  overflow-x: auto;
  border: 1px solid var(--vp-c-divider-light);
  border-radius: 4px;
}

.notion-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.5;
}

.notion-table :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider-light);
  min-width: 100px;
  vertical-align: top;
}

.notion-table :deep(tr:nth-child(odd) td) {
  background-color: var(--vp-c-bg-soft);
}

.notion-table :deep(tr:nth-child(even) td) {
  background-color: var(--vp-c-bg);
}

.dark .notion-table :deep(tr:nth-child(odd) td) {
  background-color: var(--vp-c-bg-alt);
}

.dark .notion-table :deep(tr:nth-child(even) td) {
  background-color: var(--vp-c-bg-soft);
}
</style>
