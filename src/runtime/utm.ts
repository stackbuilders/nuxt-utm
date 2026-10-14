import type { Ref } from 'vue'
import type { LocationQuery } from 'vue-router'
import { createStorage } from './storage'
import { isDataObject } from './history'
import { GOOGLE_CLICK_PARAMETERS, UTM_PARAMETERS } from './parameters'
import type { ParameterValues } from './parameters'
import type { UTMParams, AdditionalInfo, DataObject, GCLIDParams } from './types'

// Configured names such as constructor would otherwise read what every object inherits
const readParam = (query: LocationQuery, name: string) =>
  Object.hasOwn(query, name) ? query[name] : undefined

const hasAnyParam = (query: LocationQuery, names: readonly string[]): boolean =>
  names.some((name) => Boolean(readParam(query, name)))

const readParams = <Name extends string>(query: LocationQuery, names: readonly Name[]) =>
  Object.fromEntries(
    names.map((name) => [name, readParam(query, name)?.toString()]),
  ) as ParameterValues<Name>

const sameValues = <Name extends string>(
  names: readonly Name[],
  first: ParameterValues<Name> | undefined,
  second: ParameterValues<Name> | undefined,
): boolean => names.every((name) => first?.[name] === second?.[name])

const sameKeysAndValues = (
  first: ParameterValues<string> = {},
  second: ParameterValues<string> = {},
): boolean =>
  sameValues([...new Set([...Object.keys(first), ...Object.keys(second)])], first, second)

export const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15)
}

export const readLocalData = (
  localStorageKey: string,
  storage = createStorage(() => localStorage),
): DataObject[] => {
  try {
    const stored: unknown = JSON.parse(storage.getItem(localStorageKey) ?? '[]')
    return Array.isArray(stored) ? stored.filter(isDataObject) : []
  } catch {
    return []
  }
}

export const getSessionID = (
  sessionIdKey: string,
  storage = createStorage(() => sessionStorage),
): string => {
  const existing = storage.getItem(sessionIdKey)
  if (existing) return existing
  const sessionId = generateSessionId()
  storage.setItem(sessionIdKey, sessionId)
  return sessionId
}

export const urlHasUtmParams = (query: LocationQuery): boolean => hasAnyParam(query, UTM_PARAMETERS)

export const getUtmParams = (query: LocationQuery): UTMParams => readParams(query, UTM_PARAMETERS)

export const urlHasGCLID = (query: LocationQuery): boolean =>
  hasAnyParam(query, GOOGLE_CLICK_PARAMETERS)

export const getGCLID = (query: LocationQuery): GCLIDParams =>
  readParams(query, GOOGLE_CLICK_PARAMETERS)

export const urlHasClickParams = (query: LocationQuery, names: readonly string[]): boolean =>
  hasAnyParam(query, names)

export const getClickParams = (
  query: LocationQuery,
  names: readonly string[],
): ParameterValues<string> => readParams(query, names)

export const getAdditionalInfo = (landingPageUrl = window.location.href): AdditionalInfo => {
  return {
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    language: navigator.language,
    landingPageUrl,
    screen: {
      width: screen.width,
      height: screen.height,
    },
  }
}

export const isRepeatedEntry = (data: Ref<DataObject[]>, currentEntry: DataObject): boolean => {
  const lastEntry = data.value?.[0]

  return (
    !!lastEntry?.utmParams &&
    lastEntry.sessionId === currentEntry.sessionId &&
    sameValues(UTM_PARAMETERS, lastEntry.utmParams, currentEntry.utmParams) &&
    sameValues(GOOGLE_CLICK_PARAMETERS, lastEntry.gclidParams, currentEntry.gclidParams) &&
    // The configured names can change between visits, so compare every stored click ID
    sameKeysAndValues(lastEntry.clickParams, currentEntry.clickParams)
  )
}
