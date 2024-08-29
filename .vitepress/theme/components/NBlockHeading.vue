<template>
   <h1 v-if="level === 'heading_1'">
    <NRichText v-for="rtext in props.rich_text"  v-bind="rtext" ></NRichText>
   </h1>
   <h2 v-else-if="level === 'heading_2'">
    <NRichText v-for="rtext in props.rich_text"  v-bind="rtext" ></NRichText>
   </h2>
   <h3 v-else="level === 'heading_3'">
    <NRichText v-for="rtext in props.rich_text"  v-bind="rtext" ></NRichText>
   </h3>
</template>

<script  setup>

const props = defineProps({
    level: String,
    rich_text: Array
})


</script>

<style scoped>
h1 {
    color: #444;
    font-size: 1.7em;
}
h2 {
    color: #555;
    font-size: 1.4em;
}
h3 {
    color: #666;
    font-size: 1.2em;
}
</style>