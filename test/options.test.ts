import { describe, expect, it } from 'vitest'
import type { ModuleOptions } from '../src/runtime/types'
import { validateOptions } from '../src/options'

describe('validateOptions', () => {
  it('accepts a list of click parameter names', () => {
    expect(() => validateOptions({ clickParams: ['fbclid', 'msclkid'] })).not.toThrow()
  })

  it.each<unknown>(['fbclid', [''], [1], [' fbclid'], ['msclkid ']])(
    'rejects clickParams %j',
    (clickParams) => {
      expect(() => validateOptions({ clickParams } as ModuleOptions)).toThrow(
        '[nuxt-utm] clickParams must be a list of query parameter names',
      )
    },
  )

  it.each([
    ['utm_source', 'utmParams'],
    ['gclid', 'gclidParams'],
  ])('rejects the built-in name %s', (name, field) => {
    expect(() => validateOptions({ clickParams: ['fbclid', name] })).toThrow(
      `[nuxt-utm] clickParams cannot include ${name}, which is already captured in ${field}`,
    )
  })
})
