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
