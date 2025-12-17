import type { Ref } from 'vue'
import type { DataObject } from 'nuxt-utm'
import { useNuxtApp } from '#imports'

export interface UseNuxtUTMReturn {
  data: Readonly<Ref<readonly DataObject[]>>
  trackingEnabled: Readonly<Ref<boolean>>
  enableTracking: () => void
  disableTracking: () => void
  clearData: () => void
}

export const useNuxtUTM = (): UseNuxtUTMReturn => {
  const nuxtApp = useNuxtApp()

  return {
    data: nuxtApp.$utm,
    trackingEnabled: nuxtApp.$utmTrackingEnabled,
    enableTracking: nuxtApp.$utmEnableTracking,
    disableTracking: nuxtApp.$utmDisableTracking,
    clearData: nuxtApp.$utmClearData,
  }
}
