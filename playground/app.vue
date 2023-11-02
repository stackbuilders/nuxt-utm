<template>
  <div>Nuxt 3 UTM module playground!</div>
  <pre>{{ $utm }}</pre>
</template>

<script setup>
import { useNuxtApp } from "nuxt/app";

const { $utm } = useNuxtApp();
</script>
