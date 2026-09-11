import { describe, expect, it } from 'vitest'
import type { DataObject } from '../src/runtime/types'
import { createAttributionSnapshot, isDataObject, retainHistory } from '../src/runtime/history'

const visit = (source: string | undefined, timestamp: string): DataObject => ({
  timestamp,
  sessionId: 'session',
  utmParams: source ? { utm_source: source } : {},
  additionalInfo: {
    referrer: '',
    userAgent: 'test',
    language: 'en',
    landingPageUrl: 'https://example.com/',
    screen: { width: 1280, height: 720 },
  },
})

describe('retained attribution history', () => {
  const first = visit('google', '2026-01-01T00:00:00Z')
  const last = visit('newsletter', '2026-01-02T00:00:00Z')
  const direct = visit(undefined, '2026-01-03T00:00:00Z')
  const history = [direct, last, first]

  it('preserves history without limits by default', () => {
    expect(retainHistory(history, {})).toEqual(history)
  })

  it('expires entries at the boundary before applying the entry limit', () => {
    expect(
      retainHistory(history, { maxAge: 86400, maxEntries: 2 }, Date.parse(direct.timestamp)),
    ).toEqual([direct])
    expect(retainHistory(history, { maxEntries: 2 })).toEqual([direct, last])
  })

  it('keeps first and latest campaigns when the visitor returns directly', () => {
    expect(createAttributionSnapshot(history)).toEqual({
      firstTouch: first,
      lastTouch: last,
      history,
    })
  })

  it('recognizes a Google click identifier as a campaign', () => {
    const click = { ...direct, gclidParams: { gclid: 'click-id' } }
    expect(createAttributionSnapshot([click]).lastTouch).toEqual(click)
  })

  it('returns null campaign touches for direct visits and empty history', () => {
    expect(createAttributionSnapshot([direct])).toEqual({
      firstTouch: null,
      lastTouch: null,
      history: [direct],
    })
    expect(createAttributionSnapshot([])).toEqual({
      firstTouch: null,
      lastTouch: null,
      history: [],
    })
  })

  it('detaches backend payloads, including nested custom data, from live history', () => {
    const entry = { ...first, customParams: { category: { name: 'apartments' } } }
    const snapshot = createAttributionSnapshot([entry])
    const category = snapshot.history[0]!.customParams!.category as { name: string }
    category.name = 'changed'
    expect(entry.customParams.category.name).toBe('apartments')
  })

  it.each([
    null,
    {},
    [],
    { ...first, utmParams: null },
    { ...first, timestamp: 'invalid' },
    { ...first, additionalInfo: {} },
  ])('rejects malformed stored entries: %j', (entry) => {
    expect(isDataObject(entry)).toBe(false)
  })
})
