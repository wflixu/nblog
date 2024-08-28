// https://nuxt.com/docs/api/configuration/nuxt-config

import 'dotenv/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  routeRules: {
    '/api/**': { cors: true },
  },
  runtimeConfig: {
    notionToken: process.env.NXUT_NOTION_TOKEN,
    databaseId: process.env.NXUT_DATABASE_ID,
    apiHost: process.env.NXUT_API_HOST,
  },

  typescript: {
    strict: false,
  },

  components: [
    {
      global: true,
      path: '~/components',
      pathPrefix: false,
    }
  ],

  app: {
    head: {
      title: "Today Blog"
    }
  },
  modules: ["@nuxt/image", "@nuxt/icon"]
})