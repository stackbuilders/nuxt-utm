import { describe, expect, it } from 'vitest'
import type { ModuleOptions } from '../src/runtime/types'
import { validateOptions } from '../src/options'

describe('validateOptions', () => {
  it('accepts a list of click parameter names', () => {
    expect(() => validateOptions({ clickParams: ['fbclid', 'msclkid'] })).not.toThrow()
  })

  it.each<unknown>(['fbclid', [''], [1]])('rejects clickParams %j', (clickParams) => {
    expect(() => validateOptions({ clickParams } as ModuleOptions)).toThrow(
      '[nuxt-utm] clickParams must be a list of query parameter names',
    )
  })
})
