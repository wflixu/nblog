<template>
    <Layout>
        <template #doc-before>
            <PostMeta />
        </template>
        <template #doc-footer-before>
            <Copyright />
        </template>
    </Layout>
</template>
<script setup>
import DefaultTheme from 'vitepress/theme'
import Copyright from './Copyright.vue'
import PostMeta from './PostMeta.vue'

const { Layout } = DefaultTheme
</script>
