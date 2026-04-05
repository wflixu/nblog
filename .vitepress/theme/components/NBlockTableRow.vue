<template>
  <tr>
    <td v-for="(cell, index) in cells" :key="index">
      <template v-for="(richText, rIndex) in cell" :key="rIndex">
        <NRichText v-bind="richText"></NRichText>
      </template>
    </td>
  </tr>
</template>

<script setup>
defineProps({
  cells: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
td {
  word-break: break-word;
}
</style>
