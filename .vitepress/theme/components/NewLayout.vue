<template>
    <Layout>
        <template #doc-footer-before>
            <Copyright />
        </template>
    </Layout>
</template>
<script setup>
import DefaultTheme from 'vitepress/theme'
import Copyright from './Copyright.vue'

const { Layout } = DefaultTheme
</script>
