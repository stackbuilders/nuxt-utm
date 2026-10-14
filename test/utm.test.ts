import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import type { LocationQuery } from 'vue-router'
import type { DataObject, GCLIDParams } from '../src/runtime/types'
import { createStorage } from '../src/runtime/storage'
import {
  getClickParams,
  getGCLID,
  getUtmParams,
  isRepeatedEntry,
  readLocalData,
  urlHasClickParams,
  urlHasGCLID,
  urlHasUtmParams,
} from '../src/runtime/utm'

const entry: DataObject = {
  timestamp: '2023-11-02T10:11:17.219Z',
  utmParams: {
    utm_source: 'test_source',
    utm_medium: 'test_medium',
    utm_campaign: 'test_campaign',
    utm_term: 'test_term',
    utm_content: 'test_content',
  },
  additionalInfo: {
    referrer: 'http://localhost:3000/?utm_source=test_source',
    userAgent: 'test',
    language: 'en-GB',
    landingPageUrl: 'http://localhost:3000/',
    screen: { width: 1728, height: 1117 },
  },
  sessionId: 'beai1gx7dg',
}

const storageWith = (items: Record<string, string>) =>
  createStorage(() => ({ getItem: (key: string) => items[key] ?? null }) as unknown as Storage)

describe('readLocalData', () => {
  it('returns an empty history when nothing is stored', () => {
    expect(readLocalData('nuxt-utm-test', storageWith({}))).toEqual([])
  })

  it('returns the entries stored under the key', () => {
    const storage = storageWith({ 'nuxt-utm-test': JSON.stringify([entry]) })
    expect(readLocalData('nuxt-utm-test', storage)).toEqual([entry])
  })
})

describe('urlHasUtmParams', () => {
  it('returns false without UTM parameters', () => {
    expect(urlHasUtmParams({})).toBe(false)
  })

  it('returns true when at least one UTM parameter is present', () => {
    expect(urlHasUtmParams({ utm_source: 'test_source' })).toBe(true)
  })

  it.each(['utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic'])(
    'treats the GA4 parameter %s alone as a campaign',
    (name) => {
      expect(urlHasUtmParams({ [name]: 'value' })).toBe(true)
    },
  )
})

describe('getUtmParams', () => {
  it('reads the UTM parameters, including the GA4 ones, from the query', () => {
    const query = {
      utm_id: 'test_id',
      utm_source: 'test_source',
      utm_medium: 'test_medium',
      utm_campaign: 'test_campaign',
      utm_source_platform: 'test_platform',
      utm_term: 'test_term',
      utm_content: 'test_content',
      utm_creative_format: 'test_format',
      utm_marketing_tactic: 'test_tactic',
    }
    expect(getUtmParams(query)).toEqual(query)
  })

  it('returns no values when no UTM parameters are present', () => {
    expect(getUtmParams({ page: '2' })).toEqual({})
  })
})

describe('urlHasGCLID', () => {
  it('returns false without Google click parameters', () => {
    expect(urlHasGCLID({ utm_source: 'test_source' })).toBe(false)
  })

  it.each(['gclid', 'gad_source', 'gad_campaignid', 'gbraid', 'wbraid', 'dclid'])(
    'treats %s alone as a campaign',
    (name) => {
      expect(urlHasGCLID({ [name]: 'value' })).toBe(true)
    },
  )
})

interface GCLIDCase {
  name: string
  query: LocationQuery
  expected: GCLIDParams
}

describe('getGCLID', () => {
  it.each<GCLIDCase>([
    {
      name: 'both parameters',
      query: { gclid: 'testGclid123', gad_source: 'testGadSourceABC' },
      expected: { gclid: 'testGclid123', gad_source: 'testGadSourceABC' },
    },
    {
      name: 'gclid alone',
      query: { gclid: 'testGclid123' },
      expected: { gclid: 'testGclid123', gad_source: undefined },
    },
    {
      name: 'gad_source alone',
      query: { gad_source: 'testGadSourceABC' },
      expected: { gclid: undefined, gad_source: 'testGadSourceABC' },
    },
    {
      name: 'a query without either parameter',
      query: {},
      expected: { gclid: undefined, gad_source: undefined },
    },
    {
      name: 'empty strings',
      query: { gclid: '', gad_source: '' },
      expected: { gclid: '', gad_source: '' },
    },
    {
      name: 'gclid with an empty gad_source',
      query: { gclid: 'testGclid123', gad_source: '' },
      expected: { gclid: 'testGclid123', gad_source: '' },
    },
    {
      name: 'gad_source with an empty gclid',
      query: { gclid: '', gad_source: 'testGadSourceABC' },
      expected: { gclid: '', gad_source: 'testGadSourceABC' },
    },
    {
      name: 'special characters',
      query: { gclid: 'gclid-123_abc!@#', gad_source: 'gad_source-XYZ*%^' },
      expected: { gclid: 'gclid-123_abc!@#', gad_source: 'gad_source-XYZ*%^' },
    },
    {
      name: 'numeric strings',
      query: { gclid: '12345', gad_source: '67890' },
      expected: { gclid: '12345', gad_source: '67890' },
    },
    {
      name: 'null values as undefined',
      query: { gclid: null, gad_source: null },
      expected: { gclid: undefined, gad_source: undefined },
    },
    {
      name: 'gclid with a null gad_source',
      query: { gclid: 'testGclid123', gad_source: null },
      expected: { gclid: 'testGclid123', gad_source: undefined },
    },
    {
      name: 'repeated parameters as comma-separated strings',
      query: {
        gclid: ['testGclid123', 'anotherGclid'],
        gad_source: ['testGadSourceABC', 'anotherGadSource'],
      },
      expected: {
        gclid: 'testGclid123,anotherGclid',
        gad_source: 'testGadSourceABC,anotherGadSource',
      },
    },
    {
      name: 'the campaign ID and the click IDs that replace gclid',
      query: { gad_campaignid: '123', gbraid: 'app-click', wbraid: 'web-click', dclid: 'dv-click' },
      expected: {
        gad_campaignid: '123',
        gbraid: 'app-click',
        wbraid: 'web-click',
        dclid: 'dv-click',
      },
    },
    {
      name: 'a single and a repeated parameter',
      query: { gclid: 'testGclid123', gad_source: ['testGadSourceABC', 'anotherGadSource'] },
      expected: { gclid: 'testGclid123', gad_source: 'testGadSourceABC,anotherGadSource' },
    },
  ])('reads $name', ({ query, expected }) => {
    expect(getGCLID(query)).toEqual(expected)
  })
})

describe('configured click parameters', () => {
  const names = ['fbclid', 'msclkid']

  it('detects only the configured names', () => {
    expect(urlHasClickParams({ fbclid: 'meta-click' }, names)).toBe(true)
    expect(urlHasClickParams({ ttclid: 'tiktok-click' }, names)).toBe(false)
    expect(urlHasClickParams({ fbclid: 'meta-click' }, [])).toBe(false)
  })

  it('reads the configured names from the query', () => {
    const query = { fbclid: 'meta-click', ttclid: 'tiktok-click' }
    expect(getClickParams(query, names)).toEqual({ fbclid: 'meta-click' })
  })

  it('matches names with their exact casing', () => {
    const query = { sccid: 'other-click', ScCid: 'snap-click' }
    expect(getClickParams(query, ['ScCid'])).toEqual({ ScCid: 'snap-click' })
  })

  it('ignores names the query inherits from Object.prototype', () => {
    expect(urlHasClickParams({}, ['constructor', 'toString'])).toBe(false)
    expect(getClickParams({}, ['constructor'])).toEqual({})
  })
})

describe('isRepeatedEntry', () => {
  const history = ref<DataObject[]>([entry])

  it('detects the same campaign in the same session', () => {
    expect(isRepeatedEntry(history, { ...entry })).toBe(true)
  })

  it('treats the same campaign in a new session as a new entry', () => {
    expect(isRepeatedEntry(history, { ...entry, sessionId: 'new-session' })).toBe(false)
  })

  it.each(['utm_content', 'utm_id'] as const)(
    'treats a changed %s in the same session as a new entry',
    (name) => {
      const utmParams = { ...entry.utmParams, [name]: 'new-value' }
      expect(isRepeatedEntry(history, { ...entry, utmParams })).toBe(false)
    },
  )

  it('treats a new Google click ID in the same session as a new entry', () => {
    expect(isRepeatedEntry(history, { ...entry, gclidParams: { gbraid: 'app-click' } })).toBe(false)
  })

  it('compares configured click IDs within the same session', () => {
    const click = { ...entry, clickParams: { fbclid: 'meta-click' } }
    expect(isRepeatedEntry(history, click)).toBe(false)
    expect(isRepeatedEntry(ref([click]), { ...click, clickParams: { fbclid: 'meta-click' } })).toBe(
      true,
    )
  })

  it('treats a visit without click IDs after one with them as a new entry', () => {
    const click = { ...entry, clickParams: { fbclid: 'meta-click' } }
    expect(isRepeatedEntry(ref([click]), entry)).toBe(false)
  })
})
