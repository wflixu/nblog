import DefaultTheme from 'vitepress/theme'
import { Theme } from 'vitepress'
import NewLayout from './components/NewLayout.vue'
import Archives from './components/Archives.vue'
import Category from './components/Category.vue'
import Tags from './components/Tags.vue'
import Comment from './components/Comment.vue'
import HomePage from './components/HomePage.vue'
import PostMeta from './components/PostMeta.vue'

import './custom.css'

export default {
    extends: DefaultTheme,
    Layout: NewLayout,
    enhanceApp({ app }) {
        app.component('Tags', Tags)
        app.component('Category', Category)
        app.component('Archives', Archives)
        app.component('Comment', Comment)
        app.component('HomePage', HomePage)
        app.component('PostMeta', PostMeta)
    }
} satisfies Theme
