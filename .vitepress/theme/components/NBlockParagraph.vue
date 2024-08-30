<template>
    <p class="n-p">
        <NRichText v-for="rtext in props.rich_text" v-bind="rtext"></NRichText>
    </p>
</template>

<script setup >


const props = defineProps({
    rich_text: Object
})

</script>

<style scoped></style>