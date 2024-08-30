<template>
    <template v-if="isHeading">
        <NBlockHeading v-bind="headingProps" :level="props.type" :key="props.id"></NBlockHeading>
    </template>
    <template v-else-if="props.paragraph">
        <NBlockParagraph v-bind="props.paragraph" :key="props.id"></NBlockParagraph>
    </template>
    <template v-else-if="props.code">
        <NBlockCode v-bind="props.code" :key="props.id"></NBlockCode>
    </template>
    <template v-else-if="props.image">
        <NBlockImage v-bind="props.image" :key="props.id"></NBlockImage>
    </template>
</template>

<script setup > 
import {computed} from 'vue'


const props = defineProps({
    id:String,
    type:{
        type: String,
        require: true
    },
    paragraph :Object,
    heading_1: Object,
    code: Object,
    heading_2: Object,
    heading_3: Object,
    image: Object,
});

const isHeading = computed(() => {
    return props.type.startsWith("heading_")
})
const headingProps = computed(() => {
    return props[props.type] 
})

</script>

