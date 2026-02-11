<template>
  <div>
    <h1>UTM Tracker</h1>
    <p>Tracking: {{ utm.trackingEnabled.value ? 'Enabled' : 'Disabled' }}</p>
    <pre>{{ utm.data.value }}</pre>
  </div>
</template>

<script setup>
import { useNuxtUTM } from '#imports'

const utm = useNuxtUTM()
</script>
