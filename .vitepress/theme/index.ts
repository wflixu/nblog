import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import NewLayout from './components/NewLayout.vue'
import Archives from './components/Archives.vue'
import Category from './components/Category.vue'
import Tags from './components/Tags.vue'
import Page from './components/Page.vue'
import Comment from './components/Comment.vue'
import NContent from './components/NContent.vue'
import NBlockOne from './components/NBlockOne.vue'
import NBlockCode from './components/NBlockCode.vue'
import NBlockHeading from './components/NBlockHeading.vue'
import NBlockImage from './components/NBlockImage.vue'
import NBlockParagraph from './components/NBlockParagraph.vue'
import NRichText from './components/NRichText.vue'

const components = {
    NContent,
    NBlockOne,
    NBlockCode,
    NBlockHeading,
    NBlockImage,
    NBlockParagraph,
    NRichText
}

import './custom.css'

export default {
    ...DefaultTheme,
    Layout: NewLayout,
    enhanceApp({ app }) {
        // register global compoment
        app.component('Tags', Tags)
        app.component('Category', Category)
        app.component('Archives', Archives)
        app.component('Page', Page)
        app.component('Comment', Comment)

        Object.entries(components).forEach(([name, comp]) => {
            app.component(name, comp)
        })
    }
} satisfies Theme
