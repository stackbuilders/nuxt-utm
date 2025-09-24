export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Nuxt UTM Playground',
    },
  },
  utm: {
    trackingEnabled: true,
  },
})
