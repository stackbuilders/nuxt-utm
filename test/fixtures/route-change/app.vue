<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo, useNuxtUTM } from '#imports'

const utm = useNuxtUTM()
const lastSource = ref<string>()

async function openNewsletter() {
  await navigateTo('/?utm_source=newsletter')
  const { lastTouch } = await utm.getAttribution()
  lastSource.value = lastTouch?.utmParams.utm_source ?? 'none'
}
</script>

<template>
  <button type="button" @click="openNewsletter">Newsletter</button>
  <button type="button" @click="utm.enableTracking()">Accept tracking</button>
  <p v-if="lastSource">Last touch: {{ lastSource }}</p>
</template>
