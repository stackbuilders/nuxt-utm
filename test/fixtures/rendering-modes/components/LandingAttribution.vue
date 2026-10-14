<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { onNuxtReady, useNuxtUTM } from '#imports'

const utm = useNuxtUTM()
const landingPagesOnMount = ref<string[]>()
const landingPagesWhenReady = ref<string[]>()

async function readLandingPages() {
  const { history } = await utm.getAttribution()
  return history.map(({ additionalInfo }) => additionalInfo.landingPageUrl)
}

onMounted(async () => {
  landingPagesOnMount.value = await readLandingPages()
})
onNuxtReady(async () => {
  landingPagesWhenReady.value = await readLandingPages()
})
</script>

<template>
  <NuxtLink to="/ssr?utm_source=next">Next campaign</NuxtLink>
  <button type="button" @click="utm.capture()">Capture</button>
  <output data-testid="on-mount">{{
    landingPagesOnMount && JSON.stringify(landingPagesOnMount)
  }}</output>
  <output data-testid="when-ready">{{
    landingPagesWhenReady && JSON.stringify(landingPagesWhenReady)
  }}</output>
</template>
