import type {
  DataObject,
  BeforeTrackContext,
  ClickParams,
  GCLIDParams,
  ModuleOptions,
  UTMParams,
  UseNuxtUTMReturn,
  AttributionSnapshot,
} from 'nuxt-utm'

export const options: ModuleOptions = {
  trackingEnabled: false,
  maxAge: 86400,
  maxEntries: 100,
  trackOnRouteChange: true,
  captureWithoutCampaign: false,
  clickParams: ['fbclid', 'msclkid', 'partner_click_id'],
}
// Known click IDs must stay literal members of the option type so editors suggest them.
export const suggestedClickParam: Extract<
  NonNullable<ModuleOptions['clickParams']>[number],
  'ScCid'
> = 'ScCid'
// @ts-expect-error Click parameter names must remain strings in the published package.
export const invalidClickNames: ModuleOptions = { clickParams: [123] }
export function campaign(data: DataObject): string | undefined {
  return data.utmParams.utm_campaign
}
export function metaClick(data: DataObject): string | undefined {
  return data.clickParams?.fbclid
}
export function skip(context: BeforeTrackContext): void {
  context.skip = true
}

// @ts-expect-error Campaign values must retain their string type in the published package.
export const invalid: UTMParams = { utm_source: 123 }
// @ts-expect-error Click IDs must retain their string type in the published package.
export const invalidClick: GCLIDParams = { gbraid: 123 }
// @ts-expect-error Configured click IDs must retain their string type in the published package.
export const invalidAdClick: ClickParams = { fbclid: 123 }
export const adClicks: ClickParams = { ScCid: 'snap-click', partner_click_id: 'abc123' }
export const ga4Campaign: UTMParams = { utm_id: 'spring', utm_source_platform: 'Search Ads 360' }

declare module 'nuxt-utm' {
  interface UTMParams {
    utm_partner?: string
  }
  interface GCLIDParams {
    partner_click_id?: string
  }
}
export const augmentedCampaign: UTMParams = { utm_partner: 'spring-fair' }
export const augmentedClick: GCLIDParams = { partner_click_id: 'abc123' }

export function enrich(utm: UseNuxtUTMReturn): void {
  utm.onBeforePersist((data) => {
    data.customParams = { pageCategory: 'apartments' }
    // @ts-expect-error Hook payloads must not become any when consumed outside this repository.
    data.utmParams = 123
  })
}

export async function payload(utm: UseNuxtUTMReturn): Promise<AttributionSnapshot> {
  await utm.capture()
  return utm.getAttribution()
}
