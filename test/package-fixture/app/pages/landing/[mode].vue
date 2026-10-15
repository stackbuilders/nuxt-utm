<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAsyncData, useNuxtUTM } from '#imports'

defineOptions({ name: 'CampaignLandingPage' })

const utm = useNuxtUTM()
const { data: heading } = await useAsyncData('landing-heading', async () => 'Campaign landing')
const landingPagesOnMount = ref<string[]>()

onMounted(async () => {
  const { history } = await utm.getAttribution()
  landingPagesOnMount.value = history.map(({ additionalInfo }) => additionalInfo.landingPageUrl)
})
</script>

<template>
  <main>
    <h1>{{ heading }}</h1>
    <output data-testid="on-mount">{{
      landingPagesOnMount && JSON.stringify(landingPagesOnMount)
    }}</output>
    <NuxtLink to="/contact?utm_source=newsletter">Newsletter contact link</NuxtLink>
  </main>
</template>
