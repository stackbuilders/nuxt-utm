import { defineNuxtPlugin } from '#app'
import { useNuxtUTM } from '#imports'

export default defineNuxtPlugin(() => {
  const utm = useNuxtUTM()

  utm.onBeforePersist((data) => {
    const landingPageUrl = data.additionalInfo?.landingPageUrl
    if (!landingPageUrl) return

    const pageCategory = new URL(landingPageUrl).searchParams.get('page_category')
    if (!pageCategory) return

    data.customParams = {
      ...data.customParams,
      pageCategory,
    }
  })
})
