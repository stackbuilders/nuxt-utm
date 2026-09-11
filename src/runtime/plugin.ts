import type { BeforeTrackContext, DataObject, ModuleOptions, NuxtUTMHooks } from './types'
import type { RouteLocationNormalized } from 'vue-router'
import { computed, ref, readonly } from 'vue'
import { createStorage } from './storage'
import {
  createAttributionSnapshot,
  getCampaignTouches,
  isDataObject,
  retainHistory,
} from './history'
import {
  readLocalData,
  getSessionID,
  getUtmParams,
  getAdditionalInfo,
  isRepeatedEntry,
  urlHasGCLID,
  urlHasUtmParams,
  getGCLID,
} from './utm'
import { defineNuxtPlugin, useRuntimeConfig, useRouter } from '#app'

const LOCAL_STORAGE_KEY = 'nuxt-utm-data'
const SESSION_ID_KEY = 'nuxt-utm-session-id'
const TRACKING_ENABLED_KEY = 'nuxt-utm-tracking-enabled'

export default defineNuxtPlugin((nuxtApp) => {
  const options = useRuntimeConfig().public.utm as Required<
    Pick<ModuleOptions, 'trackingEnabled' | 'trackOnRouteChange' | 'captureWithoutCampaign'>
  > &
    ModuleOptions
  const router = useRouter()
  const isClient = typeof window !== 'undefined'
  const local = createStorage(() => localStorage)
  const session = createStorage(() => sessionStorage)
  const data = ref<DataObject[]>([])
  const storedPreference = isClient ? local.getItem(TRACKING_ENABLED_KEY) : null
  const trackingEnabled = ref(
    storedPreference === null ? options.trackingEnabled : storedPreference === 'true',
  )
  const touches = computed(() => getCampaignTouches(data.value))
  let generation = 0
  let pending = Promise.resolve()
  let cancelPending!: () => void
  let cancelled = new Promise<void>((resolve) => {
    cancelPending = resolve
  })

  function saveHistory(entries: DataObject[]) {
    if (entries.length) local.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries))
    else local.removeItem(LOCAL_STORAGE_KEY)
    data.value = entries
  }

  function refreshHistory() {
    if (!isClient) return
    const stored = readLocalData(LOCAL_STORAGE_KEY, local)
    const retained = retainHistory(stored, options)
    data.value = retained
    if (retained.length !== stored.length) saveHistory(retained)
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
    cancelPending()
    cancelled = new Promise<void>((resolve) => {
      cancelPending = resolve
    })
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

      if (!options.captureWithoutCampaign && !urlHasUtmParams(query) && !urlHasGCLID(query)) return

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
      const retained = retainHistory([snapshot, ...data.value], options)
      if (!retained.includes(snapshot)) return
      saveHistory(retained)
      return snapshot
    }

    const operation = Promise.race([pending.then(process), cancelled]).catch(() => {
      console.warn('[nuxt-utm] Tracking failed; this visit could not be completed')
    })
    pending = operation.then(() => {})
    return operation.then(async (entry) => {
      if (entry && isActive()) await runHook('utm:tracked', JSON.parse(JSON.stringify(entry)))
    })
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

  const getAttribution = async () => {
    let current: Promise<void>
    do {
      current = pending
      await current
    } while (current !== pending)
    refreshHistory()
    return createAttributionSnapshot(data.value)
  }

  refreshHistory()
  nuxtApp.hook('app:mounted', async () => {
    if (options.trackOnRouteChange) {
      router.afterEach((to, from, failure) => {
        if (!failure && to.fullPath !== from.fullPath) void capture(to)
      })
    }
    await capture()
  })

  return {
    provide: {
      utm: readonly(data),
      utmTrackingEnabled: readonly(trackingEnabled),
      utmStorageAvailable: computed(() => isClient && local.persistent.value),
      utmFirstTouch: readonly(computed(() => touches.value.firstTouch)),
      utmLastTouch: readonly(computed(() => touches.value.lastTouch)),
      utmGetAttribution: getAttribution,
      utmCapture: () => capture(),
      utmEnableTracking: enableTracking,
      utmDisableTracking: disableTracking,
      utmClearData: clearData,
    },
  }
})
