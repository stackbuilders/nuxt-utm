import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, createPage } from '@nuxt/test-utils'

describe('Module when disabled', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/disabled', import.meta.url)),
    server: true,
    browser: true,
  })

  it('should not track UTM parameters', async () => {
    const page = await createPage('/?utm_source=test_source&utm_medium=test_medium')
    const rawData = await page.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
    expect(rawData).toBeNull()
    await page.close()
  })

  it('should not provide $utm in Nuxt app', async () => {
    const page = await createPage('/')
    const hasUtm = await page.evaluate(() => {
      const nuxtApp = (window as any).useNuxtApp?.()
      return nuxtApp?.$utm !== undefined
    })
    expect(hasUtm).toBe(false)
    await page.close()
  })

  it('should not have useNuxtUTM composable available', async () => {
    const html = await $fetch('/')
    expect(html).toContain('<h1>UTM Tracker</h1>')
  })
})