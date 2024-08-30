<template>
    <a v-if="href" :href="href" :class="cls" target="_blank">
        {{ props.plain_text }}
    </a>
    <span v-else :class="cls">
        {{ props.plain_text }}
    </span>
</template>

<script setup>

import {computed} from 'vue'

const props = defineProps({
    type: String,
    plain_text: String,
    href: String,
    annotations: Object,
    text: Object
})

const href = computed(() => {
    return props.href
})
const cls = computed(() => {
    let res = Object.entries(props.annotations).filter(([key, val]) => {
        return val
    }).map(([key, val]) => {
        return key === 'code' ? val : key;
    });
    return res;
})





</script>

<style scoped></style>