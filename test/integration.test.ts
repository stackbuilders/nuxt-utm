import { fileURLToPath } from 'node:url'
import type { DataObject } from 'nuxt-utm'
import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { setup, $fetch, createPage } from '@nuxt/test-utils'
import type { Page } from 'playwright-core'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    browser: true,
  })

  let entries: DataObject[]
  let page: Page

  beforeEach(async () => {
    page = await createPage(
      '/?utm_source=test_source&utm_medium=test_medium&utm_campaign=test_campaign&utm_term=test_term&utm_content=test_content&gad_source=1&gclid=testKey',
    )
    const rawData = await page.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
    entries = await JSON.parse(rawData ?? '[]')
  })

  describe('Module Playground', () => {
    it('Renders the index page', async () => {
      const html = await $fetch('/')
      expect(html).toContain('<h1>UTM Tracker</h1>')
    })
  })

  describe('Additional info', () => {
    it('Stores data in local storage', () => {
      expect(entries?.[0]).toBeDefined()
    })

    it('Stores Additional info', () => {
      expect(entries?.[0].additionalInfo).toBeDefined()
    })

    it('Stores the correct values', async () => {
      const info = await page.evaluate(() => {
        return {
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          language: navigator.language,
          landingPageUrl: window.location.href,
          screen: {
            width: screen.width,
            height: screen.height,
          },
        }
      })
      expect(entries?.[0].additionalInfo).toEqual(info)
    })
  })

  describe('UTM params', () => {
    it('Stores UTM params', () => {
      expect(entries?.[0].utmParams).toEqual({
        utm_campaign: 'test_campaign',
        utm_content: 'test_content',
        utm_medium: 'test_medium',
        utm_source: 'test_source',
        utm_term: 'test_term',
      })
    })

    it("Doesn't store anything after a page reload with the same UTM params and session", async () => {
      await page.reload()
      const rawData = await page?.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
      entries = await JSON.parse(rawData ?? '[]')
      expect(entries.length).toEqual(1)
    })

    it('Stores a new value if the UTM params are different but the session is the same', async () => {
      const currentSessionId = await page.evaluate(() =>
        sessionStorage.getItem('nuxt-utm-session-id'),
      )

      const newPage = await createPage(
        '/?utm_source=test_source2&utm_medium=test_medium2&utm_campaign=test_campaign2&utm_term=test_term2&utm_content=test_content2',
      )

      if (currentSessionId) {
        await newPage.evaluate((sessionId) => {
          sessionStorage.setItem('nuxt-utm-session-id', sessionId)
        }, currentSessionId)
      }

      await newPage.reload()

      const rawData = await newPage.evaluate(() => localStorage.getItem('nuxt-utm-data'))
      entries = await JSON.parse(rawData ?? '[]')
      expect(entries[0].utmParams).toEqual({
        utm_campaign: 'test_campaign2',
        utm_content: 'test_content2',
        utm_medium: 'test_medium2',
        utm_source: 'test_source2',
        utm_term: 'test_term2',
      })

      await newPage.close()
    })

    it('Stores a new value if the UTM params are the same but the session is different', async () => {
      await page.evaluate(() => sessionStorage.setItem('nuxt-utm-session-id', 'old-session'))
      await page.reload()
      const rawData = await page.evaluate(() => localStorage.getItem('nuxt-utm-data'))
      entries = await JSON.parse(rawData ?? '[]')
      expect(entries[0].utmParams).toEqual({
        utm_campaign: 'test_campaign',
        utm_content: 'test_content',
        utm_medium: 'test_medium',
        utm_source: 'test_source',
        utm_term: 'test_term',
      })
    })
  })

  describe('GCLID params', () => {
    it('Stores GCLID params', () => {
      expect(entries?.[0].gclidParams).toEqual({
        gclid: 'testKey',
        gad_source: '1',
      })
    })

    it("Doesn't store anything after a page reload with the same UTM params and session", async () => {
      await page.reload()
      const rawData = await page?.evaluate(() => window.localStorage.getItem('nuxt-utm-data'))
      entries = await JSON.parse(rawData ?? '[]')
      expect(entries.length).toEqual(1)
    })

    it('Stores a new value if the GCLID params are different but the session is the same', async () => {
      const currentSessionId = await page.evaluate(() =>
        sessionStorage.getItem('nuxt-utm-session-id'),
      )

      const newPage = await createPage(
        '/?utm_source=test_source&utm_medium=test_medium&utm_campaign=test_campaign&utm_term=test_term&utm_content=test_content&gad_source=2&gclid=testKey2',
      )

      if (currentSessionId) {
        await newPage.evaluate((sessionId) => {
          sessionStorage.setItem('nuxt-utm-session-id', sessionId)
        }, currentSessionId)
      }

      await newPage.reload()

      const rawData = await newPage.evaluate(() => localStorage.getItem('nuxt-utm-data'))
      entries = await JSON.parse(rawData ?? '[]')
      expect(entries?.[0].gclidParams).toEqual({
        gclid: 'testKey2',
        gad_source: '2',
      })

      await newPage.close()
    })

    it('Stores a new value if the GCLID params are the same but the session is different', async () => {
      await page.evaluate(() => sessionStorage.setItem('nuxt-utm-session-id', 'old-session'))
      await page.reload()
      const rawData = await page.evaluate(() => localStorage.getItem('nuxt-utm-data'))
      entries = await JSON.parse(rawData ?? '[]')
      expect(entries?.[0].gclidParams).toEqual({
        gclid: 'testKey',
        gad_source: '1',
      })
    })
  })
})

describe('clear functionality', () => {
  beforeAll(async () => {
    await setup({
      rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
      browser: true,
    })
  })

  let page: Page

  beforeEach(async () => {
    page = await createPage('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  it('Should clear UTM data from localStorage', async () => {
    // First, add some UTM data
    await page.goto('/?utm_source=test_source&utm_medium=test_medium&utm_campaign=test_campaign')
    await page.waitForTimeout(100)

    // Verify data exists
    let rawData = await page.evaluate(() => {
      return localStorage.getItem('nuxt-utm-data')
    })
    expect(rawData).not.toBeNull()

    // Call clear function
    await page.evaluate(() => {
      window.$nuxt.$utm.clear()
    })

    // Verify localStorage is cleared
    rawData = await page.evaluate(() => {
      return localStorage.getItem('nuxt-utm-data')
    })
    expect(rawData).toBeNull()
  })

  it('Should clear session data from sessionStorage', async () => {
    // First, add some UTM data to generate a session
    await page.goto('/?utm_source=test_source&utm_medium=test_medium')
    await page.waitForTimeout(100)

    // Verify session exists
    let sessionData = await page.evaluate(() => {
      return sessionStorage.getItem('nuxt-utm-session-id')
    })
    expect(sessionData).not.toBeNull()

    // Call clear function
    await page.evaluate(() => {
      window.$nuxt.$utm.clear()
    })

    // Verify sessionStorage is cleared
    sessionData = await page.evaluate(() => {
      return sessionStorage.getItem('nuxt-utm-session-id')
    })
    expect(sessionData).toBeNull()
  })

  it('Should clear reactive data array', async () => {
    // First, add some UTM data
    await page.goto('/?utm_source=test_source&utm_medium=test_medium')
    await page.waitForTimeout(100)

    // Verify reactive data exists
    let dataLength = await page.evaluate(() => {
      return window.$nuxt.$utm.data.value.length
    })
    expect(dataLength).toBeGreaterThan(0)

    // Call clear function
    await page.evaluate(() => {
      window.$nuxt.$utm.clear()
    })

    // Verify reactive data is cleared
    dataLength = await page.evaluate(() => {
      return window.$nuxt.$utm.data.value.length
    })
    expect(dataLength).toBe(0)
  })

  it('Should prevent data from being reloaded after clear', async () => {
    // First, add some UTM data
    await page.goto('/?utm_source=test_source&utm_medium=test_medium')
    await page.waitForTimeout(100)

    // Verify data exists
    let dataLength = await page.evaluate(() => {
      return window.$nuxt.$utm.data.value.length
    })
    expect(dataLength).toBe(1)

    // Clear the data
    await page.evaluate(() => {
      window.$nuxt.$utm.clear()
    })

    // Navigate to a page without UTM params
    await page.goto('/')
    await page.waitForTimeout(100)

    // Data should still be empty
    dataLength = await page.evaluate(() => {
      return window.$nuxt.$utm.data.value.length
    })
    expect(dataLength).toBe(0)

    // localStorage should still be empty
    const rawData = await page.evaluate(() => {
      return localStorage.getItem('nuxt-utm-data')
    })
    expect(rawData).toBeNull()
  })

  it('Should allow new data to be captured after clear', async () => {
    // Add initial data
    await page.goto('/?utm_source=initial&utm_medium=initial')
    await page.waitForTimeout(100)

    // Clear the data
    await page.evaluate(() => {
      window.$nuxt.$utm.clear()
    })

    // Add new data
    await page.goto('/?utm_source=new&utm_medium=new')
    await page.waitForTimeout(100)

    // Should have exactly one new entry
    const dataLength = await page.evaluate(() => {
      return window.$nuxt.$utm.data.value.length
    })
    expect(dataLength).toBe(1)

    // Should be the new data, not the old
    const utmData = await page.evaluate(() => {
      return window.$nuxt.$utm.data.value[0].utmParams
    })
    expect(utmData.utm_source).toBe('new')
    expect(utmData.utm_medium).toBe('new')
  })
})
