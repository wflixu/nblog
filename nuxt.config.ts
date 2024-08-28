// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  routeRules: {
    '/api/**': { cors: true },
  },
  runtimeConfig: {
    ntoken: "",
    host: "https://api.notion.com/v1/"
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