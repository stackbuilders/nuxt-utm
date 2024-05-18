export default defineNuxtConfig({
  app: {
    head: {
      title: "Nuxt UTM Playground",
    },
  },
  modules: ["../src/module"],
  utm: {},
  devtools: { enabled: true },
});
