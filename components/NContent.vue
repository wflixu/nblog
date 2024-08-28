<template>
    <section class="n-section">
        <template v-for="bl in props.results">
           <NBlockOne v-bind="bl"></NBlockOne>
        </template>
    </section>
</template>

<script  setup>


const props = defineProps(
    {
        results: {
            type: Array
        },
    })

onMounted(() => {
    console.log(props.results)
})
</script>
