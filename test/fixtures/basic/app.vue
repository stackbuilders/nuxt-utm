<template>
  <div>
    <h1>UTM Tracker</h1>
    <pre>{{ $utmData }}</pre>
  </div>
</template>

<script setup>
import { useNuxtApp } from "nuxt/app";

const { $utmData } = useNuxtApp();
</script>
