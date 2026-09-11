import { describe, expect, it } from 'vitest'
import { createStorage } from '../src/runtime/storage'

describe('storage fallback', () => {
  it('keeps the latest data after a quota failure instead of rereading stale storage', () => {
    const stale = new Map([['history', 'old']])
    const storage = createStorage(
      () =>
        ({
          getItem: (key: string) => stale.get(key) ?? null,
          setItem: () => {
            throw new DOMException('Full', 'QuotaExceededError')
          },
          removeItem: (key: string) => stale.delete(key),
        }) as unknown as Storage,
    )
    expect(storage.getItem('history')).toBe('old')
    storage.setItem('history', 'new')
    expect(storage.persistent.value).toBe(false)
    expect(storage.getItem('history')).toBe('new')
    storage.removeItem('history')
    expect(storage.getItem('history')).toBeNull()
    expect(stale.has('history')).toBe(false)
  })

  it('works when reading the storage property itself throws', () => {
    const storage = createStorage(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    expect(storage.getItem('history')).toBeNull()
    storage.setItem('history', 'captured')
    expect(storage.getItem('history')).toBe('captured')
    storage.removeItem('history')
    expect(storage.getItem('history')).toBeNull()
  })
})
