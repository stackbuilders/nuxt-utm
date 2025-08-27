import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, createPage } from '@nuxt/test-utils'

describe('Module when tracking disabled by default', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/disabled', import.meta.url)),
    server: true,
    browser: true,
  })

  it('should not track UTM parameters when disabled', async () => {
    const page = await createPage('/?utm_source=test_source&utm_medium=test_medium')
    await page.waitForTimeout(500)
    const rawData = await page.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
    expect(rawData).toBeNull()
    await page.close()
  })

  it('should show tracking is disabled', async () => {
    const page = await createPage('/')
    const trackingStatus = await page.textContent('p')
    expect(trackingStatus).toContain('Tracking: Disabled')
    await page.close()
  })

  it('should still render the page', async () => {
    const html = await $fetch('/')
    expect(html).toContain('<h1>UTM Tracker</h1>')
  })
})
