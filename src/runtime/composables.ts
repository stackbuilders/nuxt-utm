import type { Ref } from 'vue'
import type { DataObject, BeforeTrackContext } from 'nuxt-utm'
import { useNuxtApp } from '#imports'

type HookCleanup = () => void

export interface UseNuxtUTMReturn {
  data: Readonly<Ref<readonly DataObject[]>>
  trackingEnabled: Readonly<Ref<boolean>>
  enableTracking: () => void
  disableTracking: () => void
  clearData: () => void
  onBeforeTrack: (cb: (context: BeforeTrackContext) => void | Promise<void>) => HookCleanup
  onBeforePersist: (cb: (data: DataObject) => void | Promise<void>) => HookCleanup
  onTracked: (cb: (data: DataObject) => void | Promise<void>) => HookCleanup
}

export const useNuxtUTM = (): UseNuxtUTMReturn => {
  const nuxtApp = useNuxtApp()

  return {
    data: nuxtApp.$utm,
    trackingEnabled: nuxtApp.$utmTrackingEnabled,
    enableTracking: nuxtApp.$utmEnableTracking,
    disableTracking: nuxtApp.$utmDisableTracking,
    clearData: nuxtApp.$utmClearData,
    onBeforeTrack: (cb) => nuxtApp.hook('utm:before-track', cb),
    onBeforePersist: (cb) => nuxtApp.hook('utm:before-persist', cb),
    onTracked: (cb) => nuxtApp.hook('utm:tracked', cb),
  }
}
