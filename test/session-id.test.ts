import { describe, expect, it } from 'vitest'
import { generateSessionId } from '../src/runtime/utm'

describe('generateSessionId', () => {
  it('generates 128 random bits as 32 hex characters', () => {
    expect(generateSessionId()).toMatch(/^[0-9a-f]{32}$/)
  })
})
