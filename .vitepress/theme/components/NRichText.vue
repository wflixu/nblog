<template>
    <a v-if="href" :href="href" :class="cls" :style="colorStyles" target="_blank">
        {{ props.plain_text }}
    </a>
    <span v-else :class="cls" :style="colorStyles">
        {{ props.plain_text }}
    </span>
</template>

<script setup>
import { computed } from 'vue'

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
    if (!props.annotations) return []
    let res = Object.entries(props.annotations)
        .filter(([key, val]) => {
            // 排除颜色相关属性，这些通过 style 处理
            if (['background_color', 'text_color'].includes(key)) return false
            return val
        })
        .map(([key, val]) => {
            if (key === 'code') return val
            if (key === 'underline') return 'text-underline'
            if (key === 'strikethrough') return 'text-strikethrough'
            return key
        })
    return res
})

const colorStyles = computed(() => {
    const styles = {}
    if (!props.annotations) return styles

    // 处理背景色
    if (props.annotations.background_color) {
        styles.backgroundColor = props.annotations.background_color
    }

    // 处理文字颜色
    if (props.annotations.text_color) {
        styles.color = props.annotations.text_color
    }

    return styles
})
</script>

<style scoped>
.text-underline {
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
}

.text-strikethrough {
    text-decoration: line-through;
    text-decoration-thickness: 1px;
}
</style>
