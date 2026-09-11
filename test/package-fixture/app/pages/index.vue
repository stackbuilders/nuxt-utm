<script setup lang="ts">
import { useNuxtUTM } from '#imports'

defineOptions({ name: 'LandingPage' })

const utm = useNuxtUTM()
</script>

<template>
  <main>
    <h1>Static campaign landing page</h1>
    <ClientOnly>
      <p data-testid="source">
        {{ utm.lastTouch.value?.utmParams.utm_source }}
      </p>
    </ClientOnly>
    <NuxtLink to="/contact?utm_source=newsletter">Newsletter contact link</NuxtLink>
  </main>
</template>
