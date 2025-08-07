<template>
  <div style="padding: 20px; font-family: sans-serif;">
    <h1>Nuxt 3 UTM Module Playground!</h1>

    <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px;">
      <h2>UTM Tracking Controls</h2>
      <label style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
        <input
          type="checkbox"
          v-model="isTrackingEnabled"
          @change="toggleTracking"
        >
        <span>Enable UTM Tracking</span>
      </label>
      <p><strong>Status:</strong> {{ isTrackingEnabled ? 'Enabled' : 'Disabled' }}</p>

      <button
        @click="clearData"
        style="margin: 10px 5px 0 0; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Clear UTM Data
      </button>

      <button
        @click="addTestData"
        style="margin: 10px 0 0 0; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;"
        :disabled="!isTrackingEnabled"
      >
        Add Test UTM Data
      </button>
    </div>

    <div style="margin: 20px 0;">
      <h2>Current UTM Data ({{ utm.data.length }} entries)</h2>
      <pre style="background: #f8f9fa; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 12px;">{{ JSON.stringify(utm.data.value, null, 2) }}</pre>
    </div>

    <div style="margin: 20px 0; padding: 15px; background: #e7f3ff; border-radius: 8px;">
      <h3>Test URLs</h3>
      <p>Try visiting these URLs to test UTM tracking:</p>
      <ul>
        <li><a href="/?utm_source=google&amp;utm_medium=cpc&amp;utm_campaign=test">Google CPC Campaign</a></li>
        <li><a href="/?utm_source=facebook&amp;utm_medium=social&amp;utm_campaign=promo&amp;utm_content=video">Facebook Social Promo</a></li>
        <li><a href="/?utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=weekly&amp;gclid=test123">Newsletter with GCLID</a></li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useNuxtUTM } from '#imports'

const utm = useNuxtUTM()
const isTrackingEnabled = ref(utm.enabled.value)

const toggleTracking = () => {
  utm.enabled.value = isTrackingEnabled.value
}

const clearData = () => {
  utm.clear()
}

const addTestData = () => {
  if (utm.enabled.value) {
    // Simulate a UTM visit by navigating to a test URL
    window.location.href = '/?utm_source=manual_test&utm_medium=playground&utm_campaign=demo'
  }
}

// Watch for changes in UTM enabled state
watch(() => utm.enabled.value, (newValue) => {
  isTrackingEnabled.value = newValue
})
</script>
