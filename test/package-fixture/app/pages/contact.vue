<script setup lang="ts">
import { ref } from 'vue'
import { useNuxtUTM } from '#imports'

defineOptions({ name: 'ContactPage' })

const utm = useNuxtUTM()
const email = ref('')
const submitting = ref(false)
const status = ref('')

async function submitLead() {
  if (submitting.value) return
  submitting.value = true
  try {
    const attribution = await utm.getAttribution()
    await $fetch('/api/leads', {
      method: 'POST',
      body: { email: email.value, attribution },
    })
    status.value = 'Sent'
  } catch {
    status.value = 'Please try again'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main>
    <h1>Contact us</h1>
    <ClientOnly>
      <p data-testid="source">
        {{ utm.lastTouch.value?.utmParams.utm_source }}
      </p>
      <p data-testid="history-count">
        {{ utm.data.value.length }}
      </p>
    </ClientOnly>
    <form @submit.prevent="submitLead">
      <label for="email">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        autocomplete="email"
        required
      >
      <button
        type="submit"
        :disabled="submitting"
      >
        Send
      </button>
      <p role="status">
        {{ status }}
      </p>
    </form>
  </main>
</template>
