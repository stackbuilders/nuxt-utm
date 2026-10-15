<script setup lang="ts">
import { useAsyncData } from '#imports'

defineOptions({ name: 'AsyncLandingPage' })

const { data: heading } = await useAsyncData('heading', async () => 'Campaign landing')
</script>

<template>
  <main>
    <h1>{{ heading }}</h1>
    <LandingAttribution />
  </main>
</template>
