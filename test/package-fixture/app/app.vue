<script setup lang="ts">
import { useNuxtUTM } from '#imports'

const utm = useNuxtUTM()
</script>

<template>
  <NuxtPage />
  <button type="button" @click="utm.enableTracking()">Accept tracking</button>
</template>
