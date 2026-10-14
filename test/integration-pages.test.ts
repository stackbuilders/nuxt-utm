import { fileURLToPath } from 'node:url'
import type { DataObject } from 'nuxt-utm'
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils'

describe('Pages router', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/pages', import.meta.url)),
    server: true,
    browser: true,
  })

  it('captures the route a page navigated to when it calls capture on mount', async () => {
    const page = await createPage('/')
    await page.waitForFunction(() => window.localStorage.getItem('nuxt-utm-data'))
    await page.getByRole('link', { name: 'Landing' }).click()
    await page.getByText('Captured', { exact: true }).waitFor()

    const raw = await page.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
    const [latest]: DataObject[] = JSON.parse(raw ?? '[]')
    expect(latest?.utmParams.utm_source).toBe('newsletter')
    expect(new URL(latest!.additionalInfo.landingPageUrl).pathname).toBe('/landing')

    await page.close()
  })
})
