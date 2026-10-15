import type { BeforeTrackContext, DataObject, ModuleOptions, NuxtUTMHooks } from './types'
import type { RouteLocationNormalized } from 'vue-router'
// Lets the emitted declaration name Nuxt's plugin type, which #imports does not export
import type {} from 'nuxt/app'
import { computed, ref, readonly, shallowRef, unref } from 'vue'
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
  urlHasClickParams,
  urlHasGCLID,
  urlHasUtmParams,
  getClickParams,
  getGCLID,
} from './utm'
import { isClickParameterName } from './parameters'
import { defineNuxtPlugin, useRuntimeConfig, useRouter } from '#imports'

const LOCAL_STORAGE_KEY = 'nuxt-utm-data'
const SESSION_ID_KEY = 'nuxt-utm-session-id'
const TRACKING_ENABLED_KEY = 'nuxt-utm-tracking-enabled'

export default defineNuxtPlugin((nuxtApp) => {
  const options = useRuntimeConfig().public.utm as Required<
    Pick<
      ModuleOptions,
      'trackingEnabled' | 'trackOnRouteChange' | 'captureWithoutCampaign' | 'captureLandingOnEnable'
    >
  > &
    ModuleOptions
  // A runtime config override skips the build time checks, so a malformed list must not stop tracking
  const clickParamNames = Array.isArray(options.clickParams)
    ? options.clickParams.filter(isClickParameterName)
    : []
  const router = useRouter()
  const landingRoute = unref(router.currentRoute)
  const isClient = typeof window !== 'undefined'
  const local = createStorage(() => localStorage)
  const session = createStorage(() => sessionStorage)
  // History is always replaced whole, so deep reactivity would only slow down serialization
  const data = shallowRef<DataObject[]>([])
  const storedPreference = isClient ? local.getItem(TRACKING_ENABLED_KEY) : null
  const trackingEnabled = ref(
    storedPreference === null ? options.trackingEnabled : storedPreference === 'true',
  )
  const touches = computed(() => getCampaignTouches(data.value))
  let untrackedLanding: { route: RouteLocationNormalized; timestamp: string } | undefined
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

  // During hydration the live route can still be a prerendered path or a redirect target,
  // while the campaign link pointed at the route this plugin saw during setup
  function visitedRoute(): RouteLocationNormalized {
    // Without pages, Nuxt before 3.9.1 exposes the route itself as currentRoute instead of a ref
    const route = unref(router.currentRoute)
    return nuxtApp.isHydrating && route.fullPath !== landingRoute.fullPath ? landingRoute : route
  }

  function capture(route = visitedRoute(), timestamp = new Date().toISOString()): Promise<void> {
    if (!isClient || !trackingEnabled.value) return Promise.resolve()
    const query = Object.fromEntries(
      Object.entries(route.query).map(([key, value]) => [
        key,
        Array.isArray(value) ? [...value] : value,
      ]),
    )
    const context: BeforeTrackContext = { route: { ...route, query }, query, skip: false }
    const landingPageUrl = new URL(route.fullPath, window.location.href).href
    const currentGeneration = generation
    const isActive = () => trackingEnabled.value && generation === currentGeneration

    const process = async () => {
      if (!isActive()) return
      if (!(await runHook('utm:before-track', context)) || context.skip || !isActive()) return

      const hasClickParams = urlHasClickParams(query, clickParamNames)
      const isCampaign = urlHasUtmParams(query) || urlHasGCLID(query) || hasClickParams
      if (!options.captureWithoutCampaign && !isCampaign) return

      const entry: DataObject = {
        timestamp,
        utmParams: getUtmParams(query),
        additionalInfo: getAdditionalInfo(landingPageUrl),
        sessionId: getSessionID(SESSION_ID_KEY, session),
      }
      if (urlHasGCLID(query)) entry.gclidParams = getGCLID(query)
      if (hasClickParams) entry.clickParams = getClickParams(query, clickParamNames)
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
      const current = visitedRoute()
      const landing = untrackedLanding
      untrackedLanding = undefined
      if (landing) void capture(landing.route, landing.timestamp)
      if (landing?.route.fullPath !== current.fullPath) void capture(current)
    }
  }

  const disableTracking = () => {
    invalidatePending()
    trackingEnabled.value = false
    if (isClient) local.setItem(TRACKING_ENABLED_KEY, 'false')
  }

  const clearData = () => {
    invalidatePending()
    untrackedLanding = undefined
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
    const landing = visitedRoute()
    if (options.trackOnRouteChange) {
      // Without pages, Nuxt updates the route object `from` refers to before afterEach runs,
      // so `from` already matches `to`
      let lastFullPath = landing.fullPath
      router.afterEach((to, _from, failure) => {
        if (failure || to.fullPath === lastFullPath) return
        lastFullPath = to.fullPath
        void capture(to)
      })
    }
    // Consent often arrives after the visitor has left the landing page, so its campaign waits in
    // memory until tracking is enabled
    if (options.captureLandingOnEnable && !trackingEnabled.value) {
      untrackedLanding = { route: landing, timestamp: new Date().toISOString() }
    }
    await capture(landing)
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
