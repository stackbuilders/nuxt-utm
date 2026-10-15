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
  captureLandingOnEnable: false,
  persistTrackingPreference: false,
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
// Mirrors the README's Meta fbc example so it keeps compiling against the published types.
export const metaClickId = (history: DataObject[], fbclid: string) => {
  const firstSeen = history.findLast(({ clickParams }) => clickParams?.fbclid === fbclid)
  return firstSeen && `fb.1.${Date.parse(firstSeen.timestamp)}.${fbclid}`
}
// Copies of the docs/RECIPES.md helpers that use the module's types, so the recipes keep compiling against the published package.
export const latestGoogleAdsClick = ({ history }: AttributionSnapshot) =>
  history.find(
    ({ gclidParams }) => gclidParams?.gclid || gclidParams?.gbraid || gclidParams?.wbraid,
  )?.gclidParams
const utmNames = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
export function attributionFields({ firstTouch, lastTouch }: AttributionSnapshot) {
  const fields = new URLSearchParams()
  for (const [touchName, touch] of Object.entries({ first: firstTouch, last: lastTouch })) {
    for (const name of utmNames) fields.set(`${touchName}_${name}`, touch?.utmParams[name] ?? '')
  }
  return fields
}
export function skip(context: BeforeTrackContext): void {
  context.skip = true
}

// @ts-expect-error Campaign values must retain their string type in the published package.
export const invalid: UTMParams = { utm_source: 123 }
// @ts-expect-error Click IDs must retain their string type in the published package.
export const invalidClick: GCLIDParams = { gbraid: 123 }
// @ts-expect-error Configured click IDs under any name must retain their string type in the published package.
export const invalidAdClick: ClickParams = { partner_click_id: 123 }
export const adClicks: ClickParams = { ScCid: 'snap-click', partner_click_id: 'abc123' }
// Known click IDs must stay declared keys so editors suggest them when reading an entry.
// Picking a name only the index signature covers would make it required and reject {}.
export const declaredClickParam: Pick<NonNullable<DataObject['clickParams']>, 'ScCid'> = {}
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
