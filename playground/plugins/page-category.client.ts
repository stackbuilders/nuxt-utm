import { defineNuxtPlugin } from '#app'
import { useNuxtUTM } from '#imports'

export default defineNuxtPlugin(() => {
  const utm = useNuxtUTM()

  utm.onBeforePersist((data) => {
    const pageCategory = new URL(data.additionalInfo.landingPageUrl).searchParams.get('page_category')
    if (!pageCategory) return

    data.customParams = {
      ...data.customParams,
      pageCategory,
    }
  })
})
