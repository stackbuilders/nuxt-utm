import { defineNuxtPlugin } from '#app'
import { useNuxtUTM } from '#imports'

declare global {
  interface Window {
    useNuxtUTM: typeof useNuxtUTM
  }
}

export default defineNuxtPlugin(() => {
  if (typeof window !== 'undefined') {
    window.useNuxtUTM = useNuxtUTM
  }
})
