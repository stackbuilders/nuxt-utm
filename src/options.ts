import type { ModuleOptions } from './runtime/types'
import { AD_CLICK_PARAMETERS, builtInField, isQueryParameterName } from './runtime/parameters'

export function validateOptions({ maxAge, maxEntries, clickParams }: ModuleOptions) {
  if (maxAge !== undefined && (!Number.isFinite(maxAge) || maxAge <= 0)) {
    throw new Error('[nuxt-utm] maxAge must be a positive number of seconds')
  }
  if (maxEntries !== undefined && (!Number.isInteger(maxEntries) || maxEntries <= 0)) {
    throw new Error('[nuxt-utm] maxEntries must be a positive integer')
  }
  if (
    clickParams !== undefined &&
    (!Array.isArray(clickParams) || !clickParams.every(isQueryParameterName))
  ) {
    throw new Error('[nuxt-utm] clickParams must be a list of query parameter names')
  }
  for (const name of clickParams ?? []) {
    const field = builtInField(name)
    if (field) {
      throw new Error(
        `[nuxt-utm] clickParams cannot include ${name}, which is already captured in ${field}`,
      )
    }
  }
}

// Kept out of src/runtime so the lookup stays out of the client bundle
const AD_CLICK_SPELLINGS = new Map(AD_CLICK_PARAMETERS.map((name) => [name.toLowerCase(), name]))

// Warn instead of failing the build, since a site may receive a spelling the platform does not
// document. Listing the documented spelling as well shows the other spelling is deliberate
export const clickParamWarnings = ({ clickParams = [] }: ModuleOptions): string[] => {
  const names = new Set(clickParams)
  return [...names].flatMap((name) => {
    const spelling = AD_CLICK_SPELLINGS.get(name.toLowerCase())
    return spelling && !names.has(spelling)
      ? [
          `clickParams lists ${name}; did you mean ${spelling}? Query parameter names are case-sensitive`,
        ]
      : []
  })
}
