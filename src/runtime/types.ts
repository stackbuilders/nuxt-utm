import type { RouteLocationNormalized, LocationQuery } from 'vue-router'
import type { GoogleClickParameter, ParameterValues, UTMParameter } from './parameters'

export type UTMParams = ParameterValues<UTMParameter>

export type GCLIDParams = ParameterValues<GoogleClickParameter>

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

export interface ModuleOptions {
  trackingEnabled?: boolean
  maxAge?: number
  maxEntries?: number
  trackOnRouteChange?: boolean
  captureWithoutCampaign?: boolean
}

export interface AttributionSnapshot {
  firstTouch: DataObject | null
  lastTouch: DataObject | null
  history: DataObject[]
}
