import { defineNuxtPlugin, useNuxtUTM } from '#imports'

// Consent tools often settle tracking once the app mounts, before an async page finishes hydrating
export default defineNuxtPlugin((nuxtApp) => {
  const utm = useNuxtUTM()
  nuxtApp.hook('app:mounted', () => {
    const consentOnMount = sessionStorage.getItem('consent-on-mount')
    if (consentOnMount === 'toggle') utm.disableTracking()
    if (consentOnMount) utm.enableTracking()
  })
})
