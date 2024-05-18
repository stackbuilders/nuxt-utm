export default defineNuxtConfig({
  app: {
    head: {
      title: "Nuxt UTM Playground",
    },
  },
  modules: ["../src/module"],
  utm: {
    enabled: true,
  },
  devtools: { enabled: true },
});
