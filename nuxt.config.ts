// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  runtimeConfig: {
    ntoken: "secret_hBeMb2fQgDz63o37k4V7P2EQVbkBRuPuIH3TR954rUT",
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