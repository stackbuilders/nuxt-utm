import { fileURLToPath } from 'node:url'
import type { DataObject } from 'nuxt-utm'
import { describe, it, expect } from 'vitest'
import { setup, createPage, url } from '@nuxt/test-utils'

type Page = Awaited<ReturnType<typeof createPage>>
type ConsentOnMount = 'grant' | 'toggle'
type StoredOptOut = ConsentOnMount | 'withheld'

const LANDING_PAGES = [
  { path: '/ssr', rendering: 'server-rendered async', asyncSetup: true },
  { path: '/static', rendering: 'prerendered async', asyncSetup: true },
  { path: '/sync-static', rendering: 'prerendered synchronous', asyncSetup: false },
  { path: '/client', rendering: 'client-rendered async', asyncSetup: true },
] as const

const CONSENT_CHANGES = [
  { consentOnMount: 'grant', change: 'enables tracking from a stored opt-out' },
  { consentOnMount: 'toggle', change: 'disables then enables tracking' },
] as const

async function openLandingPage(path: string, optOut?: StoredOptOut) {
  const page = await createPage()
  const problems: string[] = []
  page.on('pageerror', ({ message }) => problems.push(message))
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) problems.push(message.text())
  })
  if (optOut) {
    await page.addInitScript((consent) => {
      localStorage.setItem('nuxt-utm-tracking-enabled', 'false')
      if (consent !== 'withheld') sessionStorage.setItem('consent-on-mount', consent)
    }, optOut)
  }
  await page.goto(url(path))
  return { page, problems }
}

async function storedCampaigns(page: Page) {
  await page.getByTestId('after-startup').filter({ hasText: '[' }).waitFor()
  const stored = await page.waitForFunction(() => localStorage.getItem('nuxt-utm-data'))
  const entries: DataObject[] = JSON.parse((await stored.jsonValue()) ?? '[]')
  return entries.map(({ utmParams, additionalInfo }) => ({
    source: utmParams.utm_source,
    landingPage: relativeUrl(additionalInfo.landingPageUrl),
  }))
}

async function landingPagesReadOnMount(page: Page) {
  const text = await page.getByTestId('on-mount').filter({ hasText: '[' }).textContent()
  const landingPages: string[] = JSON.parse(text ?? '[]')
  return landingPages.map(relativeUrl)
}

function relativeUrl(url: string) {
  const { pathname, search } = new URL(url)
  return pathname + search
}

describe('Landing page across rendering modes', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/rendering-modes', import.meta.url)),
    server: true,
    browser: true,
  })

  describe.each(LANDING_PAGES)('$rendering page', ({ path, asyncSetup }) => {
    const source = path.slice(1)
    const landingPage = `${path}?utm_source=${source}`

    it('records the visited campaign once without hydration problems', async () => {
      const { page, problems } = await openLandingPage(landingPage)

      expect(await storedCampaigns(page)).toEqual([{ source, landingPage }])
      expect(problems).toEqual([])
      await page.close()
    })

    // Synchronous pages mount before the app does, so their onMounted runs before collection starts
    it.runIf(asyncSetup)('includes the visited campaign in attribution read on mount', async () => {
      const { page } = await openLandingPage(landingPage)

      expect(await landingPagesReadOnMount(page)).toEqual([landingPage])
      await page.close()
    })

    it.each(CONSENT_CHANGES)(
      'records the visited campaign once when consent $change during hydration',
      async ({ consentOnMount }) => {
        const { page } = await openLandingPage(landingPage, consentOnMount)

        expect(await storedCampaigns(page)).toEqual([{ source, landingPage }])
        await page.close()
      },
    )

    it('records the visited campaign when consent arrives after a client navigation', async () => {
      const { page, problems } = await openLandingPage(landingPage, 'withheld')
      await page.getByTestId('after-startup').filter({ hasText: '[' }).waitFor()

      await page.getByRole('link', { name: 'Next campaign' }).click()
      await page.waitForURL('**/ssr?utm_source=next')
      await page.getByRole('button', { name: 'Accept tracking' }).click()
      await page.waitForFunction(() => localStorage.getItem('nuxt-utm-data')?.includes('"next"'))

      expect(await storedCampaigns(page)).toEqual([
        { source: 'next', landingPage: '/ssr?utm_source=next' },
        { source, landingPage },
      ])
      expect(problems).toEqual([])
      await page.close()
    })
  })

  it('captures the route navigated to after a prerendered landing', async () => {
    const landingPage = '/static?utm_source=static'
    const { page } = await openLandingPage(landingPage)
    await storedCampaigns(page)

    await page.getByRole('link', { name: 'Next campaign' }).click()
    await page.waitForURL('**/ssr?utm_source=next')
    await page.getByRole('button', { name: 'Capture' }).click()
    await page.waitForFunction(() => localStorage.getItem('nuxt-utm-data')?.includes('"next"'))

    expect(await storedCampaigns(page)).toEqual([
      { source: 'next', landingPage: '/ssr?utm_source=next' },
      { source: 'static', landingPage },
    ])
    await page.close()
  })

  it.each(['/legacy', '/legacy-client'])(
    'records the URL %s landed on before a client middleware redirect',
    async (path) => {
      const landingPage = `${path}?utm_source=legacy`
      const { page } = await openLandingPage(landingPage)

      expect(await storedCampaigns(page)).toEqual([{ source: 'legacy', landingPage }])
      await page.close()
    },
  )
})
