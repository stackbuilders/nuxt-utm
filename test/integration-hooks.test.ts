import { fileURLToPath } from 'node:url'
import type { DataObject } from 'nuxt-utm'
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils'
import type { Page } from 'playwright-core'

interface BeforeTrackResult {
  route: unknown
  query: Record<string, string>
  skip: boolean
}

interface HookResults {
  beforeTrackCalled: boolean
  beforeTrackContext: BeforeTrackResult | null
  beforePersistCalled: boolean
  beforePersistData: DataObject | null
  trackedCalled: boolean
  trackedData: DataObject | null
  callOrder: string[]
}

const getHookResults = (page: Page): Promise<HookResults> =>
  page.evaluate(() => (window as unknown as { __utmHookResults: HookResults }).__utmHookResults)

const getStoredEntries = async (page: Page): Promise<DataObject[]> => {
  const raw = await page.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
  return JSON.parse(raw ?? '[]')
}

describe('Hooks mechanism', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/hooks', import.meta.url)),
    server: true,
    browser: true,
  })

  describe('utm:before-track', () => {
    it('is called with route and query context', async () => {
      const page = await createPage('/?utm_source=hook_test&utm_medium=test')
      await page.waitForFunction(
        () =>
          (window as unknown as { __utmHookResults: HookResults }).__utmHookResults
            ?.beforeTrackCalled,
      )

      const results = await getHookResults(page)
      expect(results.beforeTrackCalled).toBe(true)
      expect(results.beforeTrackContext).toBeDefined()
      expect(results.beforeTrackContext!.query.utm_source).toBe('hook_test')
      expect(results.beforeTrackContext!.skip).toBe(false)

      await page.close()
    })

    it('skips tracking when skip is set to true', async () => {
      const page = await createPage('/?utm_source=skipped&_skip_tracking=1')
      await page.waitForFunction(
        () =>
          (window as unknown as { __utmHookResults: HookResults }).__utmHookResults
            ?.beforeTrackCalled,
      )

      const results = await getHookResults(page)
      expect(results.beforeTrackCalled).toBe(true)
      expect(results.beforePersistCalled).toBe(false)
      expect(results.trackedCalled).toBe(false)

      const entries = await getStoredEntries(page)
      const hasSkipped = entries.some((e: DataObject) => e.utmParams?.utm_source === 'skipped')
      expect(hasSkipped).toBe(false)

      await page.close()
    })
  })

  describe('utm:before-persist', () => {
    it('is called after data collection', async () => {
      const page = await createPage('/?utm_source=persist_test&utm_medium=test')
      await page.waitForFunction(
        () =>
          (window as unknown as { __utmHookResults: HookResults }).__utmHookResults
            ?.beforePersistCalled,
      )

      const results = await getHookResults(page)
      expect(results.beforePersistCalled).toBe(true)
      expect(results.beforePersistData).toBeDefined()
      expect(results.beforePersistData!.utmParams.utm_source).toBe('persist_test')

      await page.close()
    })

    it('allows adding customParams to the data object', async () => {
      const page = await createPage('/?utm_source=custom_test&utm_medium=test')
      await page.waitForFunction(() => window.localStorage.getItem('nuxt-utm-data'))

      const entries = await getStoredEntries(page)
      expect(entries[0]?.customParams).toBeDefined()
      expect(entries[0]?.customParams?.hooked).toBe(true)

      await page.close()
    })

    it('supports consumer hooks for custom pageCategory tracking', async () => {
      const page = await createPage(
        '/?utm_source=page_category_test&utm_medium=test&page_category=pricing',
      )
      await page.waitForFunction(() => window.localStorage.getItem('nuxt-utm-data'))

      const entries = await getStoredEntries(page)
      const trackedEntry = entries.find(
        (entry: DataObject) => entry.utmParams?.utm_source === 'page_category_test',
      )

      expect(trackedEntry?.customParams?.pageCategory).toBe('pricing')

      await page.close()
    })
  })

  describe('utm:tracked', () => {
    it('is called after data is saved', async () => {
      const page = await createPage('/?utm_source=tracked_test&utm_medium=test')
      await page.waitForFunction(
        () =>
          (window as unknown as { __utmHookResults: HookResults }).__utmHookResults?.trackedCalled,
      )

      const results = await getHookResults(page)
      expect(results.trackedCalled).toBe(true)
      expect(results.trackedData).toBeDefined()
      expect(results.trackedData!.utmParams.utm_source).toBe('tracked_test')
      expect(results.trackedData!.customParams?.hooked).toBe(true)

      await page.close()
    })

    it('receives the same data that was saved to localStorage', async () => {
      const page = await createPage('/?utm_source=verify_save&utm_medium=test')
      await page.waitForFunction(
        () =>
          (window as unknown as { __utmHookResults: HookResults }).__utmHookResults?.trackedCalled,
      )

      const results = await getHookResults(page)
      const entries = await getStoredEntries(page)

      expect(results.trackedData!.utmParams).toEqual(entries[0]?.utmParams)
      expect(results.trackedData!.sessionId).toEqual(entries[0]?.sessionId)

      await page.close()
    })
  })

  describe('hook ordering', () => {
    it('calls hooks in order: before-track, before-persist, tracked', async () => {
      const page = await createPage('/?utm_source=order_test&utm_medium=test')
      await page.waitForFunction(
        () =>
          (window as unknown as { __utmHookResults: HookResults }).__utmHookResults?.trackedCalled,
      )

      const results = await getHookResults(page)
      expect(results.beforeTrackCalled).toBe(true)
      expect(results.beforePersistCalled).toBe(true)
      expect(results.trackedCalled).toBe(true)
      expect(results.callOrder).toEqual(['before-track', 'before-persist', 'tracked'])

      await page.close()
    })

    it('does not call before-persist or tracked when before-track skips', async () => {
      const page = await createPage('/?utm_source=skip_order&_skip_tracking=1')
      await page.waitForFunction(
        () =>
          (window as unknown as { __utmHookResults: HookResults }).__utmHookResults
            ?.beforeTrackCalled,
      )

      const results = await getHookResults(page)
      expect(results.beforeTrackCalled).toBe(true)
      expect(results.beforePersistCalled).toBe(false)
      expect(results.trackedCalled).toBe(false)
      expect(results.callOrder).toEqual(['before-track'])

      await page.close()
    })
  })

  describe('hook errors', () => {
    it('stops tracking when before-track throws', async () => {
      const page = await createPage('/?utm_source=throw_before_track&_throw_before_track=1')
      await page.waitForFunction(
        () =>
          (window as unknown as { __utmHookResults: HookResults }).__utmHookResults
            ?.beforeTrackCalled,
      )

      const results = await getHookResults(page)
      expect(results.beforeTrackCalled).toBe(true)
      expect(results.beforePersistCalled).toBe(false)
      expect(results.trackedCalled).toBe(false)
      expect(results.callOrder).toEqual(['before-track'])

      const entries = await getStoredEntries(page)
      const hasTrackedEntry = entries.some(
        (entry: DataObject) => entry.utmParams?.utm_source === 'throw_before_track',
      )
      expect(hasTrackedEntry).toBe(false)

      await page.close()
    })

    it('stops tracking when before-persist throws', async () => {
      const page = await createPage('/?utm_source=throw_before_persist&_throw_before_persist=1')
      await page.waitForFunction(
        () =>
          (window as unknown as { __utmHookResults: HookResults }).__utmHookResults
            ?.beforePersistCalled,
      )

      const results = await getHookResults(page)
      expect(results.beforeTrackCalled).toBe(true)
      expect(results.beforePersistCalled).toBe(true)
      expect(results.trackedCalled).toBe(false)
      expect(results.callOrder).toEqual(['before-track', 'before-persist'])

      const entries = await getStoredEntries(page)
      const hasTrackedEntry = entries.some(
        (entry: DataObject) => entry.utmParams?.utm_source === 'throw_before_persist',
      )
      expect(hasTrackedEntry).toBe(false)

      await page.close()
    })

    it('keeps stored data when tracked throws', async () => {
      const page = await createPage('/?utm_source=throw_tracked&_throw_tracked=1')
      await page.waitForFunction(
        () =>
          (window as unknown as { __utmHookResults: HookResults }).__utmHookResults?.trackedCalled,
      )

      const results = await getHookResults(page)
      expect(results.beforeTrackCalled).toBe(true)
      expect(results.beforePersistCalled).toBe(true)
      expect(results.trackedCalled).toBe(true)
      expect(results.callOrder).toEqual(['before-track', 'before-persist', 'tracked'])

      const entries = await getStoredEntries(page)
      const savedEntry = entries.find(
        (entry: DataObject) => entry.utmParams?.utm_source === 'throw_tracked',
      )
      expect(savedEntry).toBeDefined()

      await page.close()
    })
  })
})
