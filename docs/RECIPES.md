# Recipes

These recipes extend the [form example](../README.md#send-attribution-with-a-form). They are not part of the module; copy what you need.

## Google Analytics and Google Ads

Google Analytics reads UTM parameters, and `gclid` from Google Ads auto-tagging, from the landing page URL itself, so it does not need the attribution. Nuxt UTM does not load or depend on Google's tag. When your site loads it, two values let your backend connect a lead to Google's data later.

### Google Analytics client ID

Send the client ID with the lead. Your backend can then report later lead events for the same visitor, such as `qualify_lead` or `close_convert_lead`, through the [Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4).

```ts
// utils/google-analytics.ts
type GtagGet = (
  command: 'get',
  targetId: string,
  fieldName: 'client_id',
  callback: (clientId: string | undefined) => void,
) => void

export function getGoogleAnalyticsClientId(measurementId: string, timeout = 1000) {
  const { gtag } = window as Window & { gtag?: GtagGet }
  return new Promise<string | undefined>((resolve) => {
    if (typeof gtag !== 'function') return resolve(undefined)
    // The callback waits for gtag.js, which may never load
    const timer = setTimeout(() => resolve(undefined), timeout)
    gtag('get', measurementId, 'client_id', (clientId) => {
      clearTimeout(timer)
      resolve(clientId)
    })
  })
}
```

In the form handler, with your measurement ID in `runtimeConfig.public.gaMeasurementId`:

```ts
const [attribution, gaClientId] = await Promise.all([
  utm.getAttribution(),
  getGoogleAnalyticsClientId(config.public.gaMeasurementId),
])
await $fetch(config.public.leadEndpoint, {
  method: 'POST',
  body: { email: email.value, attribution, gaClientId },
})
```

Treat the client ID as optional. It is `undefined` at once when the page has no `gtag`, and after the timeout when gtag.js never loads, for example because a blocker stops it or basic [consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode) holds it back until the visitor consents. The lead is sent either way, and `$fetch` leaves `gaClientId` out of the JSON when it is `undefined`. If your project already types `gtag`, use that type instead of `GtagGet`.

When your backend reports these events, leave out the email and any other personal data. Google's [policy](https://support.google.com/analytics/answer/6366371) forbids passing any data to Google that it could use or recognize as personally identifiable information, including in URLs.

### Google Ads click ID

For [offline conversion import](https://support.google.com/google-ads/answer/7012522), Google says to store the GCLID with the prospect's information in your lead management system, and its sample script keeps the most recent one. The last touch can be a later campaign without a Google click, so search the whole history:

```ts
import type { AttributionSnapshot } from 'nuxt-utm'

// history is newest first, so find returns the most recent Google Ads click
export const latestGoogleAdsClick = ({ history }: AttributionSnapshot) =>
  history.find(
    ({ gclidParams }) => gclidParams?.gclid || gclidParams?.gbraid || gclidParams?.wbraid,
  )?.gclidParams
```

Some iOS clicks carry `gbraid` or `wbraid` with or instead of `gclid`, and Google [recommends sending both](https://developers.google.com/google-ads/api/docs/conversions/upload-offline#populate-click-conversions) `gclid` and `gbraid` when a conversion has both. The function returns all of that visit's Google click parameters, and it works the same on the attribution your backend receives.

## Form services that don't accept JSON

Some form services accept form fields, not JSON. Flatten first and last touch into fixed field names, such as `first_utm_source` and `last_utm_source`, and send them URL-encoded:

```ts
// utils/attribution-fields.ts
import type { AttributionSnapshot } from 'nuxt-utm'

const utmNames = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

// Unset values are sent empty so every submission has the same field names
export function attributionFields({ firstTouch, lastTouch }: AttributionSnapshot) {
  const fields = new URLSearchParams()
  for (const [touchName, touch] of Object.entries({ first: firstTouch, last: lastTouch })) {
    for (const name of utmNames) fields.set(`${touchName}_${name}`, touch?.utmParams[name] ?? '')
  }
  return fields
}
```

In the form handler:

```ts
const fields = attributionFields(await utm.getAttribution())
fields.set('email', email.value)
await $fetch(config.public.leadEndpoint, { method: 'POST', body: fields })
```

`$fetch` sends `URLSearchParams` as `application/x-www-form-urlencoded`. Add other values the same way with `fields.set()`. If your service learns a form's fields from its HTML, add a hidden input for each name.
