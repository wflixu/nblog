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
    <template v-else-if="props.bulleted_list_item">
        <NBlockBullet v-bind="props.bulleted_list_item" :key="props.id"></NBlockBullet>
    </template>
    <template v-else-if="props.numbered_list_item">
        <NBlockNumbered v-bind="props.numbered_list_item" :key="props.id"></NBlockNumbered>
    </template>
    <template v-else-if="props.toggle">
        <NBlockToggle v-bind="props.toggle" :key="props.id"></NBlockToggle>
    </template>
    <template v-else-if="props.to_do">
        <NBlockTodo v-bind="props.to_do" :key="props.id"></NBlockTodo>
    </template>
    <template v-else-if="props.quote">
        <NBlockQuote v-bind="props.quote" :key="props.id"></NBlockQuote>
    </template>
    <template v-else-if="props.callout">
        <NBlockCallout v-bind="props.callout" :key="props.id"></NBlockCallout>
    </template>
    <template v-else-if="props.bookmark">
        <NBlockBookmark v-bind="props.bookmark" :key="props.id"></NBlockBookmark>
    </template>
    <template v-else-if="props.divider">
        <NBlockDivider :key="props.id"></NBlockDivider>
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
    bulleted_list_item :Object,
    heading_1: Object,
    code: Object,
    heading_2: Object,
    heading_3: Object,
    image: Object,
    numbered_list_item: Object,
    toggle: Object,
    to_do: Object,
    quote: Object,
    callout: Object,
    bookmark: Object,
    divider: Object,
});

const isHeading = computed(() => {
    return props.type.startsWith("heading_")
})
const headingProps = computed(() => {
    return props[props.type] 
})

</script>

