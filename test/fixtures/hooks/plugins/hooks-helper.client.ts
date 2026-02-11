import type { DataObject, BeforeTrackContext } from 'nuxt-utm'
import { defineNuxtPlugin } from '#app'
import { useNuxtUTM } from '#imports'

declare global {
  interface Window {
    useNuxtUTM: typeof useNuxtUTM
    __utmHookResults: {
      beforeTrackCalled: boolean
      beforeTrackContext: BeforeTrackContext | null
      beforePersistCalled: boolean
      beforePersistData: DataObject | null
      trackedCalled: boolean
      trackedData: DataObject | null
    }
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  if (typeof window === 'undefined') return

  window.useNuxtUTM = useNuxtUTM

  window.__utmHookResults = {
    beforeTrackCalled: false,
    beforeTrackContext: null,
    beforePersistCalled: false,
    beforePersistData: null,
    trackedCalled: false,
    trackedData: null,
  }

  nuxtApp.hook('utm:before-track', (context) => {
    window.__utmHookResults.beforeTrackCalled = true
    window.__utmHookResults.beforeTrackContext = { ...context }

    if (context.query._skip_tracking === '1') {
      context.skip = true
    }
  })

  nuxtApp.hook('utm:before-persist', (data) => {
    window.__utmHookResults.beforePersistCalled = true
    window.__utmHookResults.beforePersistData = { ...data }

    data.customParams = {
      ...data.customParams,
      hooked: true,
      fbclid: data.additionalInfo?.landingPageUrl?.includes('fbclid') ? 'from-hook' : undefined,
    }
  })

  nuxtApp.hook('utm:tracked', (data) => {
    window.__utmHookResults.trackedCalled = true
    window.__utmHookResults.trackedData = JSON.parse(JSON.stringify(data))
  })
})
