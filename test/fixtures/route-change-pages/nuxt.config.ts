import UtmModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [UtmModule],
  routeRules: {
    '/static': { prerender: true },
  },
  utm: {
    trackOnRouteChange: true,
  },
})
