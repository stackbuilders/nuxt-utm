<template>
  <div>Nuxt module playground!</div>
  <pre>{{ $utmData }}</pre>
</template>

<script setup>
import { useNuxtApp } from "nuxt/app";

const { $utmData } = useNuxtApp();
</script>
