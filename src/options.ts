import type { ModuleOptions } from './runtime/types'
import { builtInField, isQueryParameterName } from './runtime/parameters'

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
