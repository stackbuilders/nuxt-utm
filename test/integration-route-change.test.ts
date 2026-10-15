import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage, url } from '@nuxt/test-utils'

describe('Route change tracking without pages', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/route-change', import.meta.url)),
    server: true,
    browser: true,
  })

  type Page = Awaited<ReturnType<typeof createPage>>

  const storedHistory = (page: Page) =>
    page.evaluate(() =>
      JSON.parse(window.localStorage.getItem('nuxt-utm-data') ?? '[]').map(
        (entry: {
          utmParams: { utm_source?: string }
          additionalInfo: { landingPageUrl: string }
        }) => [entry.utmParams.utm_source, new URL(entry.additionalInfo.landingPageUrl).search],
      ),
    )

  it('captures a client-side navigation to new campaign parameters', async () => {
    const page = await createPage('/?utm_source=landing')
    await page.waitForFunction(() => window.localStorage.getItem('nuxt-utm-data'))
    await page.getByRole('button', { name: 'Newsletter' }).click()
    const lastTouch = page.getByText(/^Last touch:/)
    await lastTouch.waitFor()

    expect(new URL(page.url()).search).toBe('?utm_source=newsletter')
    expect(await lastTouch.textContent()).toBe('Last touch: newsletter')
    expect(await storedHistory(page)).toEqual([
      ['newsletter', '?utm_source=newsletter'],
      ['landing', '?utm_source=landing'],
    ])

    await page.close()
  })

  it('records the landing campaign when tracking is enabled after a client-side navigation', async () => {
    const page = await createPage()
    await page.addInitScript(() => localStorage.setItem('nuxt-utm-tracking-enabled', 'false'))
    await page.goto(url('/?utm_source=landing'))
    await page.getByRole('button', { name: 'Newsletter' }).click()
    await page.getByText('Last touch: none').waitFor()
    await page.getByRole('button', { name: 'Accept tracking' }).click()
    await page.waitForFunction(() => localStorage.getItem('nuxt-utm-data')?.includes('"landing"'))

    expect(await storedHistory(page)).toEqual([
      ['newsletter', '?utm_source=newsletter'],
      ['landing', '?utm_source=landing'],
    ])

    await page.close()
  })
})
