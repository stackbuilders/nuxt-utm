import type { Ref } from 'vue'
import type { LocationQuery } from 'vue-router'
import { createStorage } from './storage'
import { isDataObject } from './history'
import type { UTMParams, AdditionalInfo, DataObject, GCLIDParams } from './types'

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

export const urlHasUtmParams = (query: LocationQuery): boolean => {
  return Boolean(
    query.utm_source ||
    query.utm_medium ||
    query.utm_campaign ||
    query.utm_term ||
    query.utm_content,
  )
}

export const getUtmParams = (query: LocationQuery): UTMParams => {
  return {
    utm_source: query.utm_source?.toString(),
    utm_medium: query.utm_medium?.toString(),
    utm_campaign: query.utm_campaign?.toString(),
    utm_term: query.utm_term?.toString(),
    utm_content: query.utm_content?.toString(),
  }
}

export const urlHasGCLID = (query: LocationQuery): boolean => {
  return Boolean(query.gclid || query.gad_source)
}

export const getGCLID = (query: LocationQuery): GCLIDParams => {
  return {
    gclid: query.gclid?.toString(),
    gad_source: query.gad_source?.toString(),
  }
}

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
  const lastUtm = lastEntry?.utmParams
  const newUtm = currentEntry.utmParams
  const lastGCLID = lastEntry?.gclidParams
  const newGCLID = currentEntry.gclidParams

  return (
    !!lastEntry &&
    !!lastUtm &&
    lastUtm.utm_campaign === newUtm.utm_campaign &&
    lastUtm.utm_content === newUtm.utm_content &&
    lastUtm.utm_medium === newUtm.utm_medium &&
    lastUtm.utm_source === newUtm.utm_source &&
    lastUtm.utm_term === newUtm.utm_term &&
    lastEntry.sessionId === currentEntry.sessionId &&
    lastGCLID?.gad_source === newGCLID?.gad_source &&
    lastGCLID?.gclid === newGCLID?.gclid
  )
}
