<template>
    <img :src="href" alt="">
</template>

<script  setup>


const props = defineProps({
    type:String,
    file: Object
})

const href = computed(() => {
    return props.file.url
})

</script>

<style scoped></style>