import UtmModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [UtmModule],
  utm: {
    captureWithoutCampaign: false,
    clickParams: ['fbclid', 'msclkid'],
  },
})
