<template>
  <div>
    <h1>UTM Tracker</h1>
    <pre>{{ $utm }}</pre>
  </div>
</template>

<script setup>
import { useNuxtApp } from 'nuxt/app'

const { $utm } = useNuxtApp()
</script>
