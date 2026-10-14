<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useNuxtUTM } from '#imports'

defineOptions({ name: 'LandingPage' })

const utm = useNuxtUTM()
const captured = ref(false)

onMounted(async () => {
  await utm.capture()
  captured.value = true
})
</script>

<template>
  <h1>Landing</h1>
  <p>{{ captured ? 'Captured' : 'Capturing' }}</p>
</template>
