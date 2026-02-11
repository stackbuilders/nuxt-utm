import type { DataObject, BeforeTrackContext } from 'nuxt-utm'
import { ref, readonly } from 'vue'
import {
  readLocalData,
  getSessionID,
  getUtmParams,
  getAdditionalInfo,
  isRepeatedEntry,
  urlHasGCLID,
  getGCLID,
} from './utm'
import { defineNuxtPlugin, useRuntimeConfig } from '#app'

const LOCAL_STORAGE_KEY = 'nuxt-utm-data'
const SESSION_ID_KEY = 'nuxt-utm-session-id'
const TRACKING_ENABLED_KEY = 'nuxt-utm-tracking-enabled'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const data = ref<DataObject[]>([])

  const getInitialTrackingState = (): boolean => {
    if (typeof window === 'undefined') return config.public.utm?.trackingEnabled ?? true

    const storedState = localStorage.getItem(TRACKING_ENABLED_KEY)
    if (storedState !== null) {
      return storedState === 'true'
    }
    return config.public.utm?.trackingEnabled ?? true
  }

  const trackingEnabled = ref(getInitialTrackingState())

  const processUtmData = async () => {
    if (typeof window === 'undefined') return
    if (!trackingEnabled.value) return

    data.value = readLocalData(LOCAL_STORAGE_KEY)

    const query = nuxtApp._route.query
    const route = nuxtApp._route

    const beforeTrackContext: BeforeTrackContext = { route, query, skip: false }
    await nuxtApp.callHook('utm:before-track', beforeTrackContext)
    if (beforeTrackContext.skip) return

    const sessionId = getSessionID(SESSION_ID_KEY)
    const utmParams = getUtmParams(query)
    const additionalInfo = getAdditionalInfo()
    const timestamp = new Date().toISOString()

    const dataObject: DataObject = {
      timestamp,
      utmParams,
      additionalInfo,
      sessionId,
    }

    if (urlHasGCLID(query)) {
      dataObject.gclidParams = getGCLID(query)
    }

    await nuxtApp.callHook('utm:before-persist', dataObject)

    if (isRepeatedEntry(data, dataObject)) return

    data.value.unshift(dataObject)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.value))

    await nuxtApp.callHook('utm:tracked', dataObject)
  }

  const enableTracking = () => {
    trackingEnabled.value = true
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRACKING_ENABLED_KEY, 'true')
      processUtmData()
    }
  }

  const disableTracking = () => {
    trackingEnabled.value = false
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRACKING_ENABLED_KEY, 'false')
    }
  }

  const clearTrackingData = () => {
    data.value = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      sessionStorage.removeItem(SESSION_ID_KEY)
    }
  }

  if (typeof window !== 'undefined') {
    data.value = readLocalData(LOCAL_STORAGE_KEY)
  }

  nuxtApp.hook('app:mounted', processUtmData)

  return {
    provide: {
      utm: readonly(data),
      utmTrackingEnabled: readonly(trackingEnabled),
      utmEnableTracking: enableTracking,
      utmDisableTracking: disableTracking,
      utmClearData: clearTrackingData,
    },
  }
})
