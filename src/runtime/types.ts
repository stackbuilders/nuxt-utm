import type { RouteLocationNormalized, LocationQuery } from 'vue-router'

export interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

export interface GCLIDParams {
  gclid?: string
  gad_source?: string
}

export interface AdditionalInfo {
  referrer: string
  userAgent: string
  language: string
  landingPageUrl: string
  screen: {
    width: number
    height: number
  }
}

export interface DataObject {
  timestamp: string
  utmParams: UTMParams
  additionalInfo: AdditionalInfo
  sessionId: string
  gclidParams?: GCLIDParams
  customParams?: Record<string, unknown>
}

export interface BeforeTrackContext {
  route: RouteLocationNormalized
  query: LocationQuery
  skip: boolean
}

export interface NuxtUTMHooks {
  'utm:before-track': (context: BeforeTrackContext) => void | Promise<void>
  'utm:before-persist': (data: DataObject) => void | Promise<void>
  'utm:tracked': (data: DataObject) => void | Promise<void>
}
