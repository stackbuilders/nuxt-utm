import type { DataObject } from 'nuxt-utm'
import { ref, watch } from 'vue'
import {
  readLocalData,
  getSessionID,
  getUtmParams,
  getAdditionalInfo,
  isRepeatedEntry,
  urlHasGCLID,
  getGCLID,
} from './utm'
import { defineNuxtPlugin, useRuntimeConfig, useRoute } from '#app'
// import { type HookResult } from "@unhead/schema";

const LOCAL_STORAGE_KEY = 'nuxt-utm-data'
const SESSION_ID_KEY = 'nuxt-utm-session-id'

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig()
  const utmConfig = (runtimeConfig.public.utm as { enabled?: boolean } | undefined) ?? {}
  const enabled = ref(utmConfig.enabled ?? true)

  const data = ref<DataObject[]>([])

  // Initialize data from localStorage on startup
  if (typeof window !== 'undefined') {
    data.value = readLocalData(LOCAL_STORAGE_KEY)
  }

  const processUtmData = () => {
    if (typeof window === 'undefined' || !enabled.value) return

    // Always refresh data from localStorage first
    data.value = readLocalData(LOCAL_STORAGE_KEY)

    const query = nuxtApp._route.query
    const utmParams = getUtmParams(query)

    // Only proceed if we have UTM parameters in the URL
    const hasUtmParams = Object.values(utmParams).some((value) => value !== undefined)
    const hasGCLID = urlHasGCLID(query)

    if (!hasUtmParams && !hasGCLID) {
      return // No UTM params or GCLID, don't add new entry
    }

    const sessionId = getSessionID(SESSION_ID_KEY)
    const additionalInfo = getAdditionalInfo()
    const timestamp = new Date().toISOString()

    const dataObject: DataObject = {
      timestamp,
      utmParams,
      additionalInfo,
      sessionId,
    }

    if (hasGCLID) {
      dataObject.gclidParams = getGCLID(query)
    }

    // Exit if the last entry is the same as the new entry
    if (isRepeatedEntry(data, dataObject)) return

    // Add the new item to the data array
    data.value.unshift(dataObject)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.value))
  }

  const clearData = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    sessionStorage.removeItem(SESSION_ID_KEY)
    data.value = []
  }

  const route = useRoute()
  watch(() => route.fullPath, processUtmData, { immediate: true })

  return {
    provide: {
      utm: { data, enabled, clear: clearData },
    },
  }
})
