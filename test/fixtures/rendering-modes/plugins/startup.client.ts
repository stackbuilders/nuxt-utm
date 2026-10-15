import { defineNuxtPlugin } from '#imports'

// Hooks added once every plugin is set up run after the plugins' own startup hooks, so every
// capture those hooks start is queued by then. onNuxtReady would also wait for an idle period,
// which a busy CI runner can withhold past the test timeout
export default defineNuxtPlugin((nuxtApp) => {
  const startupFinished = new Promise<void>((resolve) => {
    nuxtApp.hooks.hookOnce('app:created', () => {
      const mounted = new Promise((done) => nuxtApp.hooks.hookOnce('app:mounted', done))
      const hydrated = new Promise((done) => nuxtApp.hooks.hookOnce('app:suspense:resolve', done))
      void Promise.all([mounted, hydrated]).then(() => resolve())
    })
  })
  return { provide: { startupFinished } }
})
