import { describe, expect, it } from 'vitest'
import type { ModuleOptions } from '../src/runtime/types'
import { clickParamWarnings, validateOptions } from '../src/options'

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

describe('clickParamWarnings', () => {
  it.each([
    ['sccid', 'ScCid'],
    ['FBCLID', 'fbclid'],
  ])('suggests the documented spelling for %s', (name, spelling) => {
    expect(clickParamWarnings({ clickParams: ['msclkid', name] })).toEqual([
      `clickParams lists ${name}; did you mean ${spelling}? Query parameter names are case-sensitive`,
    ])
  })

  it('accepts documented spellings and names it does not know', () => {
    expect(clickParamWarnings({ clickParams: ['ScCid', 'fbclid', 'yclid'] })).toEqual([])
    expect(clickParamWarnings({})).toEqual([])
  })

  it('accepts another spelling listed beside the documented one', () => {
    expect(clickParamWarnings({ clickParams: ['ScCID', 'ScCid'] })).toEqual([])
  })

  it('warns once about a repeated name', () => {
    expect(clickParamWarnings({ clickParams: ['sccid', 'sccid'] })).toEqual([
      'clickParams lists sccid; did you mean ScCid? Query parameter names are case-sensitive',
    ])
  })
})
