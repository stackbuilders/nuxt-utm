import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils'
import type { Page } from 'playwright-core'
import type { DataObject } from 'nuxt-utm'
import type { UseNuxtUTMReturn } from '../src/runtime/composables'

declare global {
  interface Window {
    useNuxtUTM: () => UseNuxtUTMReturn
  }
}

describe('Runtime tracking control', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    server: true,
    browser: true,
  })

  let page: Page

  it('should allow disabling tracking at runtime', async () => {
    page = await createPage('/?utm_source=test1&utm_medium=test1')
    await page.waitForTimeout(500)

    // Check initial data is collected
    let rawData = await page.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
    let entries = JSON.parse(rawData ?? '[]')
    expect(entries.length).toBeGreaterThan(0)

    // Disable tracking
    await page.evaluate(() => {
      const win = window as typeof window & { useNuxtUTM?: () => UseNuxtUTMReturn }
      if (win.useNuxtUTM) {
        const utm = win.useNuxtUTM()
        utm.disableTracking()
      }
    })

    // Navigate with new UTM params
    await page.evaluate(() => {
      window.location.href = '/?utm_source=test2&utm_medium=test2'
    })
    await page.waitForTimeout(1000)

    // Check no new data was collected
    rawData = await page.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
    entries = JSON.parse(rawData ?? '[]')
    const hasTest2 = entries.some((e: DataObject) => e.utmParams?.utm_source === 'test2')
    expect(hasTest2).toBe(false)

    await page.close()
  })

  it('should allow enabling tracking at runtime', async () => {
    page = await createPage('/')

    // First disable tracking
    await page.evaluate(() => {
      const win = window as typeof window & { useNuxtUTM?: () => UseNuxtUTMReturn }
      if (win.useNuxtUTM) {
        const utm = win.useNuxtUTM()
        utm.disableTracking()
      }
    })

    // Navigate with UTM params while disabled
    await page.evaluate(() => {
      window.location.href = '/?utm_source=while_disabled&utm_medium=test'
    })
    await page.waitForTimeout(1000)

    let rawData = await page.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
    let entries = JSON.parse(rawData ?? '[]')
    const hasDisabled = entries.some((e: DataObject) => e.utmParams?.utm_source === 'while_disabled')
    expect(hasDisabled).toBe(false)

    // Enable tracking
    await page.evaluate(() => {
      const win = window as typeof window & { useNuxtUTM?: () => UseNuxtUTMReturn }
      if (win.useNuxtUTM) {
        const utm = win.useNuxtUTM()
        utm.enableTracking()
      }
    })

    await page.waitForTimeout(500)

    // Check if current page data was collected when enabled
    rawData = await page.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
    entries = JSON.parse(rawData ?? '[]')
    const hasEnabled = entries.some((e: DataObject) => e.utmParams?.utm_source === 'while_disabled')
    expect(hasEnabled).toBe(true)

    await page.close()
  })

  it('should clear all tracking data', async () => {
    page = await createPage('/?utm_source=test&utm_medium=test')
    await page.waitForTimeout(500)

    // Check data exists
    let rawData = await page.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
    const entries = JSON.parse(rawData ?? '[]')
    expect(entries.length).toBeGreaterThan(0)

    // Clear data
    await page.evaluate(() => {
      const win = window as typeof window & { useNuxtUTM?: () => UseNuxtUTMReturn }
      if (win.useNuxtUTM) {
        const utm = win.useNuxtUTM()
        utm.clearData()
      }
    })

    // Check data is cleared
    rawData = await page.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
    expect(rawData).toBeNull()

    // Check session ID is also cleared
    const sessionId = await page.evaluate(() => window.sessionStorage.getItem('nuxt-utm-session-id'))
    expect(sessionId).toBeNull()

    await page.close()
  })

  it('should persist tracking preference across page reloads', async () => {
    page = await createPage('/')

    // Disable tracking
    await page.evaluate(() => {
      const win = window as typeof window & { useNuxtUTM?: () => UseNuxtUTMReturn }
      if (win.useNuxtUTM) {
        const utm = win.useNuxtUTM()
        utm.disableTracking()
      }
    })

    // Reload page
    await page.reload()
    await page.waitForTimeout(500)

    // Check tracking is still disabled
    const isDisabled = await page.evaluate(() => {
      const win = window as typeof window & { useNuxtUTM?: () => UseNuxtUTMReturn }
      if (win.useNuxtUTM) {
        const utm = win.useNuxtUTM()
        return !utm.trackingEnabled.value
      }
      return false
    })

    expect(isDisabled).toBe(true)

    // Clean up - re-enable for other tests
    await page.evaluate(() => {
      const win = window as typeof window & { useNuxtUTM?: () => UseNuxtUTMReturn }
      if (win.useNuxtUTM) {
        const utm = win.useNuxtUTM()
        utm.enableTracking()
      }
    })

    await page.close()
  })
})
