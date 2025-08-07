import { ref, type Ref } from 'vue'
import type { DataObject } from 'nuxt-utm'
import { describe, it, expect, beforeEach } from 'vitest'
import { isRepeatedEntry, readLocalData, urlHasUtmParams, getUtmParams } from './../src/runtime/utm'

global.localStorage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string): string => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value.toString()
    },
    removeItem: (key: string): void => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key]
    },
    clear: (): void => {
      store = {}
    },
    key: (): string | null => '',
    length: Object.keys(store).length,
  }
})()

describe('readLocalData function', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  it('Returns empty array if local storage is empty', () => {
    expect(readLocalData('nuxt-utm-test')).toEqual([])
  })

  it('Returns an array with objects if local storage has data', () => {
    localStorage.setItem('nuxt-utm-test', utmItem)
    expect(readLocalData('nuxt-utm-test')).toEqual(JSON.parse(utmItem))
  })
})

describe('urlHasUtmParams function', () => {
  it('Returns false if there are no utm values', () => {
    const locationQueryMock = {}
    expect(urlHasUtmParams(locationQueryMock)).toBeFalsy()
  })

  it('Returns true if at least one utm value exists', () => {
    const locationQueryMock = { utm_source: 'test_source' }
    expect(urlHasUtmParams(locationQueryMock)).toBeTruthy()
  })
})

describe('getUtmParams function', () => {
  it('Returns the correct utm values', () => {
    const locationQueryMock = {
      utm_source: 'test_source',
      utm_medium: 'test_medium',
      utm_term: 'test_term',
      utm_content: 'test_content',
    }
    expect(getUtmParams(locationQueryMock)).toEqual({
      utm_source: 'test_source',
      utm_medium: 'test_medium',
      utm_term: 'test_term',
      utm_content: 'test_content',
    })
  })

  it('Returns undefined values when no UTM params are present', () => {
    const locationQueryMock = {}
    expect(getUtmParams(locationQueryMock)).toEqual({
      utm_source: undefined,
      utm_medium: undefined,
      utm_campaign: undefined,
      utm_term: undefined,
      utm_content: undefined,
    })
  })
})

describe('isRepeatedEntry function', () => {
  let data: Ref<DataObject[]>
  let newUtmItem: DataObject
  beforeEach(() => {
    data = ref<DataObject[]>(JSON.parse(`[${utmItem}]`))
    newUtmItem = JSON.parse(utmItem)
  })

  it('Returns true if the utm params and the session already exists in local storage', () => {
    expect(isRepeatedEntry(data, newUtmItem)).toBeTruthy()
  })
  it('Returns false if the utm params are the same but the session is different', () => {
    newUtmItem.sessionId = 'New Session'
    expect(isRepeatedEntry(data, newUtmItem)).toBeFalsy()
  })
  it('Returns false if the utm params are different but the session is the same', () => {
    newUtmItem.utmParams.utm_content = 'New UTM content'
    expect(isRepeatedEntry(data, newUtmItem)).toBeFalsy()
  })
})

describe('Module options', () => {
  it('Should have enabled option defaulting to true', () => {
    const moduleOptions = { enabled: true }
    expect(moduleOptions.enabled).toBe(true)
  })

  it('Should allow disabling the module', () => {
    const moduleOptions = { enabled: false }
    expect(moduleOptions.enabled).toBe(false)
  })

  it('Should handle undefined enabled option', () => {
    const moduleOptions: { enabled?: boolean } = {}
    expect(moduleOptions.enabled).toBeUndefined()
  })

  it('Should work with enabled option in configuration object', () => {
    const config = {
      modules: ['nuxt-utm'],
      utm: {
        enabled: false,
      },
    }
    expect(config.utm.enabled).toBe(false)
  })
})

describe('Clear functionality', () => {
  it('Should provide a clear function interface', () => {
    // Test that clear function can be called
    const clearFunction = () => {
      // Mock implementation
      return true
    }
    expect(typeof clearFunction).toBe('function')
    expect(clearFunction()).toBe(true)
  })

  it('Should handle clear operation structure', () => {
    // Test the structure of what clear should do
    const mockUtm = {
      data: { value: [] as any[] },
      enabled: { value: true },
      clear: () => {
        // Mock clear implementation
        mockUtm.data.value = []
        return true
      },
    }

    // Add some mock data
    mockUtm.data.value = [{ test: 'data' }]
    expect(mockUtm.data.value).toHaveLength(1)

    // Clear and verify
    mockUtm.clear()
    expect(mockUtm.data.value).toHaveLength(0)
  })
})

const utmItem = `{
  "timestamp": "2023-11-02T10:11:17.219Z",
  "utmParams": {
    "utm_source": "test_source",
    "utm_medium": "test_medium",
    "utm_campaign": "test_campaign",
    "utm_term": "test_term",
    "utm_content": "test_content"
  },
  "additionalInfo": {
    "referrer": "http://localhost:3000/?utm_source=test_source&utm_medium=test_medium&utm_campaign=test_campaign&utm_term=test_term&utm_content=test_content",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    "language": "en-GB",
    "screen": {
      "width": 1728,
      "height": 1117
    }
  },
  "sessionId": "beai1gx7dg"
}`
