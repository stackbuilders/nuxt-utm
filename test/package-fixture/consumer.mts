import type { DataObject, BeforeTrackContext, ModuleOptions, UTMParams, UseNuxtUTMReturn } from 'nuxt-utm'

export const options: ModuleOptions = { trackingEnabled: false }
export function campaign(data: DataObject): string | undefined {
  return data.utmParams.utm_campaign
}
export function skip(context: BeforeTrackContext): void {
  context.skip = true
}

// @ts-expect-error Campaign values must retain their string type in the published package.
export const invalid: UTMParams = { utm_source: 123 }

export function enrich(utm: UseNuxtUTMReturn): void {
  utm.onBeforePersist((data) => {
    data.customParams = { pageCategory: 'apartments' }
    // @ts-expect-error Hook payloads must not become any when consumed outside this repository.
    data.utmParams = 123
  })
}
