import UtmModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [UtmModule],
  routeRules: {
    '/static': { prerender: true },
    '/sync-static': { prerender: true },
    '/client': { ssr: false },
    '/legacy-client': { ssr: false },
  },
})
