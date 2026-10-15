<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useNuxtApp, useNuxtUTM } from '#imports'

const utm = useNuxtUTM()
const { $startupFinished } = useNuxtApp()
const landingPagesOnMount = ref<string[]>()
const landingPagesAfterStartup = ref<string[]>()

async function readLandingPages() {
  const { history } = await utm.getAttribution()
  return history.map(({ additionalInfo }) => additionalInfo.landingPageUrl)
}

onMounted(async () => {
  landingPagesOnMount.value = await readLandingPages()
})
onMounted(async () => {
  await $startupFinished
  landingPagesAfterStartup.value = await readLandingPages()
})
</script>

<template>
  <NuxtLink to="/ssr?utm_source=next">Next campaign</NuxtLink>
  <button type="button" @click="utm.capture()">Capture</button>
  <button type="button" @click="utm.enableTracking()">Accept tracking</button>
  <output data-testid="on-mount">{{
    landingPagesOnMount && JSON.stringify(landingPagesOnMount)
  }}</output>
  <output data-testid="after-startup">{{
    landingPagesAfterStartup && JSON.stringify(landingPagesAfterStartup)
  }}</output>
</template>
