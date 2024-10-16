import { useNuxtApp } from '#imports'

export const useNuxtUTM = () => {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$utm
}
