import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  const trackedRoutes: string[] = []
  Object.assign(window, { trackedRoutes })
  nuxtApp.hook('utm:before-track', ({ route }) => {
    trackedRoutes.push(route.fullPath)
  })
})
