<template>
  <div class="container">
    <h1>Nuxt UTM Module Playground</h1>

    <div class="controls">
      <h2>Tracking Controls</h2>
      <p>
        Tracking is currently:
        <strong :class="{ enabled: utm.trackingEnabled.value, disabled: !utm.trackingEnabled.value }">
          {{ utm.trackingEnabled.value ? 'ENABLED' : 'DISABLED' }}
        </strong>
      </p>

      <div class="buttons">
        <button
          :disabled="utm.trackingEnabled.value"
          @click="utm.enableTracking"
        >
          Enable Tracking
        </button>
        <button
          :disabled="!utm.trackingEnabled.value"
          @click="utm.disableTracking"
        >
          Disable Tracking
        </button>
        <button
          class="danger"
          @click="utm.clearData"
        >
          Clear All Data
        </button>
      </div>

      <div class="info">
        <p>Try visiting with UTM parameters:</p>
        <a href="/?utm_source=test&utm_medium=demo&utm_campaign=playground">
          Add UTM params to URL
        </a>
      </div>
    </div>

    <div class="data">
      <h2>Collected UTM Data ({{ utm.data.value.length }} entries)</h2>
      <pre>{{ utm.data.value }}</pre>
    </div>
  </div>
</template>

<script setup>
import { useNuxtUTM } from '#imports'

const utm = useNuxtUTM()
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  color: #00dc82;
  margin-bottom: 2rem;
}

.controls {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.buttons {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #00dc82;
  color: white;
  cursor: pointer;
  font-size: 1rem;
}

button:hover:not(:disabled) {
  background: #00c76d;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button.danger {
  background: #dc3545;
}

button.danger:hover {
  background: #c82333;
}

.enabled {
  color: #28a745;
}

.disabled {
  color: #dc3545;
}

.info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
}

.info a {
  color: #00dc82;
  text-decoration: none;
}

.info a:hover {
  text-decoration: underline;
}

.data {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}

pre {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}
</style>
