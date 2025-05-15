<template>
  <div>Nuxt 3 UTM module playground!</div>
  <pre>{{ utm }}</pre>
</template>

<script setup>
import { useNuxtUTM } from '#imports'

const utm = useNuxtUTM()
</script>
