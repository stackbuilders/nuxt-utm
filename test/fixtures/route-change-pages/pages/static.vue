<script setup lang="ts">
import { useAsyncData } from '#imports'

defineOptions({ name: 'StaticLandingPage' })

const { data: heading } = await useAsyncData('heading', async () => 'Campaign landing')
</script>

<template>
  <main>
    <h1>{{ heading }}</h1>
    <NuxtLink to="/next?utm_source=next">Next campaign</NuxtLink>
  </main>
</template>
