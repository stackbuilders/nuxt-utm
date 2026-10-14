import { describe, expect, it } from 'vitest'
import { generateSessionId } from '../src/runtime/utm'

describe('generateSessionId', () => {
  it('generates 128 random bits as 32 hex characters', () => {
    // A single ID can hide unpadded bytes, so check enough IDs to include bytes below 0x10
    const ids = Array.from({ length: 100 }, generateSessionId)

    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{32}$/)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
