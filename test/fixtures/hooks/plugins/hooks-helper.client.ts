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
      callOrder: string[]
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
    callOrder: [],
  }

  nuxtApp.hook('utm:before-track', (context) => {
    window.__utmHookResults.callOrder.push('before-track')
    window.__utmHookResults.beforeTrackCalled = true
    window.__utmHookResults.beforeTrackContext = { ...context }

    if (context.query._throw_before_track === '1') {
      throw new Error('before-track hook error')
    }

    if (context.query._skip_tracking === '1') {
      context.skip = true
    }
  })

  nuxtApp.hook('utm:before-persist', (data) => {
    window.__utmHookResults.callOrder.push('before-persist')
    window.__utmHookResults.beforePersistCalled = true
    window.__utmHookResults.beforePersistData = { ...data }

    const url = new URL(data.additionalInfo.landingPageUrl)
    if (url.searchParams.get('_throw_before_persist') === '1') {
      throw new Error('before-persist hook error')
    }

    data.customParams = {
      ...data.customParams,
      hooked: true,
      fbclid: data.additionalInfo?.landingPageUrl?.includes('fbclid') ? 'from-hook' : undefined,
    }
  })

  nuxtApp.hook('utm:tracked', (data) => {
    window.__utmHookResults.callOrder.push('tracked')
    window.__utmHookResults.trackedCalled = true
    window.__utmHookResults.trackedData = JSON.parse(JSON.stringify(data))

    const url = new URL(data.additionalInfo.landingPageUrl)
    if (url.searchParams.get('_throw_tracked') === '1') {
      throw new Error('tracked hook error')
    }
  })
})
