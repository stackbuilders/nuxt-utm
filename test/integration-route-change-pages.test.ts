import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils'

type TrackingWindow = Window & { trackedRoutes: string[] }

describe('Route change tracking with pages', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/route-change-pages', import.meta.url)),
    server: true,
    browser: true,
  })

  it('tracks a prerendered landing once, then the route navigated to', async () => {
    const page = await createPage('/static?utm_source=static')
    await page.getByRole('link', { name: 'Next campaign' }).click()
    await page.waitForFunction(() =>
      (window as TrackingWindow).trackedRoutes.includes('/next?utm_source=next'),
    )

    expect(await page.evaluate(() => (window as TrackingWindow).trackedRoutes)).toEqual([
      '/static?utm_source=static',
      '/next?utm_source=next',
    ])
    await page.close()
  })
})
