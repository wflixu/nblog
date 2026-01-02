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
    color: var(--vp-c-text-1);
    font-size: 1.7em;
}
h2 {
    color: var(--vp-c-text-1);
    font-size: 1.4em;
}
h3 {
    color: var(--vp-c-text-2);
    font-size: 1.2em;
}
</style>