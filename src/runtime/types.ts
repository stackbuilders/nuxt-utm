import type { RouteLocationNormalized, LocationQuery } from 'vue-router'
import type {
  AdClickParameter,
  GoogleClickParameter,
  ParameterValues,
  UTMParameter,
} from './parameters'

export interface UTMParams extends ParameterValues<UTMParameter> {}

export interface GCLIDParams extends ParameterValues<GoogleClickParameter> {}

export interface ClickParams extends ParameterValues<AdClickParameter> {
  [name: string]: string | undefined
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
  clickParams?: ClickParams
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
  captureLandingOnEnable?: boolean
  persistTrackingPreference?: boolean
  // Intersecting string with {} keeps the known names as editor suggestions while accepting any name
  clickParams?: (AdClickParameter | (string & {}))[]
}

export interface AttributionSnapshot {
  firstTouch: DataObject | null
  lastTouch: DataObject | null
  history: DataObject[]
}
