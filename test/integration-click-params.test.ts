import { fileURLToPath } from 'node:url'
import type { DataObject } from 'nuxt-utm'
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils'

describe('Configured click parameters', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/click-params', import.meta.url)),
    server: true,
    browser: true,
  })

  it('captures a visit tagged only with a configured click ID as a campaign', async () => {
    const page = await createPage('/?fbclid=meta-click&ttclid=tiktok-click')
    await page.waitForFunction(() => window.localStorage.getItem('nuxt-utm-data'))

    const raw = await page.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
    const [entry]: DataObject[] = JSON.parse(raw ?? '[]')
    expect(entry?.clickParams).toEqual({ fbclid: 'meta-click' })

    await page.close()
  })
})
