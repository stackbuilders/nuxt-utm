import type { BeforeTrackContext, DataObject, NuxtUTMHooks } from './types'
import type { RouteLocationNormalized } from 'vue-router'
import { computed, ref, readonly } from 'vue'
import { createStorage } from './storage'
import { isDataObject } from './history'
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
  const options = useRuntimeConfig().public.utm
  const isClient = typeof window !== 'undefined'
  const local = createStorage(() => localStorage)
  const session = createStorage(() => sessionStorage)
  const data = ref<DataObject[]>([])
  const storedPreference = isClient ? local.getItem(TRACKING_ENABLED_KEY) : null
  const trackingEnabled = ref(
    storedPreference === null ? options.trackingEnabled : storedPreference === 'true',
  )
  let generation = 0
  let pending = Promise.resolve()

  function saveHistory(entries: DataObject[]) {
    if (entries.length) local.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries))
    else local.removeItem(LOCAL_STORAGE_KEY)
    data.value = entries
  }

  function refreshHistory() {
    if (!isClient) return
    data.value = readLocalData(LOCAL_STORAGE_KEY, local)
  }

  async function runHook<Name extends keyof NuxtUTMHooks>(
    name: Name,
    ...args: Parameters<NuxtUTMHooks[Name]>
  ): Promise<boolean> {
    try {
      await nuxtApp.callHook(name, ...args)
      return true
    } catch {
      console.warn(`[nuxt-utm] Hook "${name}" failed`)
      return false
    }
  }

  function invalidatePending() {
    generation += 1
    pending = Promise.resolve()
  }

  function capture(route: RouteLocationNormalized = nuxtApp._route): Promise<void> {
    if (!isClient || !trackingEnabled.value) return Promise.resolve()
    const query = Object.fromEntries(
      Object.entries(route.query).map(([key, value]) => [
        key,
        Array.isArray(value) ? [...value] : value,
      ]),
    )
    const context: BeforeTrackContext = { route: { ...route, query }, query, skip: false }
    const landingPageUrl = new URL(route.fullPath, window.location.href).href
    const timestamp = new Date().toISOString()
    const currentGeneration = generation
    const isActive = () => trackingEnabled.value && generation === currentGeneration

    const process = async () => {
      if (!isActive()) return
      if (!(await runHook('utm:before-track', context)) || context.skip || !isActive()) return

      const entry: DataObject = {
        timestamp,
        utmParams: getUtmParams(query),
        additionalInfo: getAdditionalInfo(landingPageUrl),
        sessionId: getSessionID(SESSION_ID_KEY, session),
      }
      if (urlHasGCLID(query)) entry.gclidParams = getGCLID(query)
      if (!(await runHook('utm:before-persist', entry)) || !isActive()) return

      const snapshot: unknown = JSON.parse(JSON.stringify(entry))
      if (!isDataObject(snapshot)) {
        console.warn('[nuxt-utm] A hook returned invalid tracking data; this visit was not saved')
        return
      }
      refreshHistory()
      if (isRepeatedEntry(data, snapshot)) return
      saveHistory([snapshot, ...data.value])
      await runHook('utm:tracked', JSON.parse(JSON.stringify(snapshot)))
    }

    pending = pending.then(process).catch(() => {
      console.warn('[nuxt-utm] Tracking failed; this visit could not be completed')
    })
    return pending
  }

  const enableTracking = () => {
    trackingEnabled.value = true
    if (isClient) {
      local.setItem(TRACKING_ENABLED_KEY, 'true')
      void capture()
    }
  }

  const disableTracking = () => {
    invalidatePending()
    trackingEnabled.value = false
    if (isClient) local.setItem(TRACKING_ENABLED_KEY, 'false')
  }

  const clearData = () => {
    invalidatePending()
    data.value = []
    if (isClient) {
      local.removeItem(LOCAL_STORAGE_KEY)
      session.removeItem(SESSION_ID_KEY)
    }
  }

  refreshHistory()
  nuxtApp.hook('app:mounted', () => capture())

  return {
    provide: {
      utm: readonly(data),
      utmTrackingEnabled: readonly(trackingEnabled),
      utmStorageAvailable: computed(() => isClient && local.persistent.value),
      utmEnableTracking: enableTracking,
      utmDisableTracking: disableTracking,
      utmClearData: clearData,
    },
  }
})
