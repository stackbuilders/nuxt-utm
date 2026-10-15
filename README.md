# Nuxt UTM

[![CI](https://github.com/stackbuilders/nuxt-utm/actions/workflows/main.yml/badge.svg)](https://github.com/stackbuilders/nuxt-utm/actions/workflows/main.yml)
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

**Built in collaboration with The Durst Organization**

Nuxt UTM keeps campaign information in the browser until your application is ready to use it. It was built for **statically generated Nuxt websites**: collect a visitor's source now, then include it with a lead, signup, or form submission later.

It supports Nuxt 3 and 4, and is tested against Nuxt 5 nightly builds. Collection needs no backend, analytics account, or network request. Your application decides whether and when to send the data to its own API or CRM.

[Release notes](CHANGELOG.md) · [Recipes](docs/RECIPES.md) · [Contributing](docs/CONTRIBUTING.md)

## What is attribution?

Attribution connects an action, such as submitting a contact form, to the campaign that brought the visitor to your site.

For example, someone arrives from a Google campaign, returns through a newsletter, and later opens your contact page directly. Nuxt UTM can give your backend:

- **First touch:** the oldest retained campaign, Google in this example.
- **Last touch:** the most recent retained campaign, the newsletter.
- **History:** the retained visits, newest first, including direct visits by default.

First and last touch consider nonempty UTM, Google click, or configured click parameters. Direct visits do not replace them; both are `null` when no campaign remains. Retention can remove the original first touch, so these values describe the history still available in this browser.

This is browser-local campaign context, not a reporting dashboard or a cross-device attribution service.

## Setup

```bash
pnpm add --dev nuxt-utm
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-utm'],
})
```

The module captures the initial page after the app mounts and saves its UTM parameters, Google click parameters, configured click parameters, and visit context in localStorage. The same behavior works after `nuxt generate` with ordinary static hosting. While the app hydrates, the module records the URL the visitor opened, even when Nuxt still shows the prerendered route without the query or a client middleware has already redirected.

## Send attribution with a form

A static site can send to an independently hosted API. Configure your actual endpoint; Nuxt UTM does not create one:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-utm'],
  runtimeConfig: {
    public: {
      leadEndpoint: 'https://api.example.com/leads',
    },
  },
})
```

```vue
<script setup lang="ts">
import { ref } from 'vue'

const utm = useNuxtUTM()
const config = useRuntimeConfig()
const email = ref('')
const submitting = ref(false)
const status = ref('')

async function submitLead() {
  if (submitting.value) return
  submitting.value = true
  status.value = ''
  try {
    const attribution = await utm.getAttribution()
    await $fetch(config.public.leadEndpoint, {
      method: 'POST',
      body: { email: email.value, attribution },
    })
    status.value = 'Thank you. Your request was sent.'
  } catch {
    status.value = 'Your request could not be sent. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submitLead">
    <label for="email">Email</label>
    <input id="email" v-model="email" type="email" autocomplete="email" required />
    <button type="submit" :disabled="submitting">
      {{ submitting ? 'Sending…' : 'Contact us' }}
    </button>
    <p role="status">{{ status }}</p>
  </form>
</template>
```

`getAttribution()` waits for pending collection and enrichment, applies retention, and returns a detached, JSON-serializable `{ firstTouch, lastTouch, history }` snapshot. It does not send anything. Capture the composable during setup as above, then use its methods in event handlers.

The API must accept your static site's origin and validate the submitted data. Campaign values and all browser-stored data are untrusted input. Authentication, duplicate submission handling, and retries belong to your application. A failed submission leaves the local history available; the module does not automatically retry requests or clear data after sending.

The [recipes](docs/RECIPES.md) show how to send the Google Analytics client ID and Google Ads click IDs with a lead, and how to send attribution to form services that don't accept JSON.

## Configuration

All new collection and retention options are opt-in. Existing behavior is preserved by default.

| Option                   | Default | Behavior                                                                                                          |
| ------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `trackingEnabled`        | `true`  | Initial tracking preference when no saved preference exists.                                                      |
| `trackOnRouteChange`     | `false` | Also capture successful client-side navigations whose full URL path changes.                                      |
| `captureWithoutCampaign` | `true`  | Include visits without UTM, Google click, or configured click parameters.                                         |
| `maxAge`                 | Unset   | Retain entries younger than this many seconds. Must be positive and finite.                                       |
| `maxEntries`             | Unset   | Retain at most this many entries. Must be a positive integer.                                                     |
| `clickParams`            | Unset   | Extra campaign parameters to capture, such as other ad platforms' click IDs. Must not repeat UTM or Google names. |

For example, to retain up to 100 campaign visits for 30 days and capture client-side navigation:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-utm'],
  utm: {
    maxAge: 60 * 60 * 24 * 30,
    maxEntries: 100,
    captureWithoutCampaign: false,
    trackOnRouteChange: true,
  },
})
```

To attribute clicks from other ad platforms, list their click ID parameters. A visit with a nonempty value for any of them is a campaign visit: the values are saved in the entry's `clickParams` and count toward first touch, last touch, and deduplication. UTM and Google click parameters are already captured in `utmParams` and `gclidParams`, so the build fails if the list repeats one of them.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-utm'],
  utm: {
    clickParams: ['fbclid', 'msclkid', 'ttclid', 'li_fat_id'],
  },
})
```

Your editor suggests these platforms' click IDs:

| Platform              | Click ID    | Notes                                                                                                |
| --------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| Meta                  | `fbclid`    | Facebook also adds it to links in organic posts, so an organic share is a campaign visit.            |
| Microsoft Advertising | `msclkid`   | Added when auto-tagging is on.                                                                       |
| TikTok                | `ttclid`    |                                                                                                      |
| LinkedIn              | `li_fat_id` | Added when enhanced conversion tracking is on in the Insight Tag settings, the default for new tags. |
| X                     | `twclid`    |                                                                                                      |
| Snapchat              | `ScCid`     | Mixed case, as Snapchat sends it.                                                                    |
| Pinterest             | `epik`      |                                                                                                      |
| Reddit                | `rdt_cid`   |                                                                                                      |

Other names work the same way. Query parameter names are case-sensitive, so the build warns when a listed name matches one of these only by case, such as `sccid`. To capture another spelling on purpose, list it beside the documented one.

A click ID identifies an individual click, so check [Privacy and consent](#privacy-and-consent) before listing one.

Send click IDs to a platform's conversion API exactly as captured. Meta's [`fbc` parameter](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc) also records when the click ID was first seen. A later session can save the same click ID again, so use the oldest entry that has it. When the Meta Pixel has set an `_fbc` cookie, send that value instead.

```ts
import type { DataObject } from 'nuxt-utm'

// history is newest first, so the last match is where the click ID was first seen
const metaClickId = (history: DataObject[], fbclid: string) => {
  const firstSeen = history.findLast(({ clickParams }) => clickParams?.fbclid === fbclid)
  return firstSeen && `fb.1.${Date.parse(firstSeen.timestamp)}.${fbclid}`
}
```

Retention runs when history is loaded, a visit is saved, or `getAttribution()` is called. There is no background expiry timer.

Without retention options, history has no age or entry limit, and each new tab that lands on your site adds an entry, including direct visits by default. Two limits follow from that:

- `getAttribution()` returns the whole history. A typical entry is about 0.7 KB, so around 150 entries exceed the 100 KB default request body limit of Express's [body parser](https://expressjs.com/en/resources/middleware/body-parser.html). Send only `firstTouch` and `lastTouch` if your API doesn't need the history.
- Browsers limit localStorage to about [5 MiB per origin](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), shared with the rest of your site. Once it is full, new visits stay in memory and are lost on reload.

Set `maxEntries`, and usually `maxAge`, to keep both in bounds.

Consecutive entries with the same UTM parameters, Google click parameters, configured click parameters, and session ID are deduplicated. URLs, timestamps, and `customParams` do not participate in that comparison. This is not a pageview counter. The session ID uses sessionStorage for the current browser tab; it has no inactivity timeout.

## Composable

Nuxt auto-imports `useNuxtUTM`. With auto-imports disabled, import it from `#imports`.

```ts
const utm = useNuxtUTM()

const payload = await utm.getAttribution()
await utm.capture()
```

| Member                                                      | Purpose                                                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `data`                                                      | Read-only reactive history, newest first.                                                       |
| `firstTouch`, `lastTouch`                                   | Read-only reactive campaign entries, or `null`.                                                 |
| `trackingEnabled`                                           | Read-only reactive tracking preference.                                                         |
| `storageAvailable`                                          | Whether browser history can persist in localStorage.                                            |
| `getAttribution()`                                          | Prepare a detached snapshot after pending persistence completes.                                |
| `capture()`                                                 | Capture the current route manually, respecting tracking controls, hooks, and deduplication.     |
| `enableTracking()`                                          | Save the enabled preference and start capturing the current route.                              |
| `disableTracking()`                                         | Save the disabled preference and cancel pending collection.                                     |
| `clearData()`                                               | Clear history and the session ID, and cancel pending collection. Keeps the tracking preference. |
| `onBeforeTrack(cb)`, `onBeforePersist(cb)`, `onTracked(cb)` | Register a hook; return a function that unregisters it.                                         |

Access refs with `.value` in script, for example `utm.lastTouch.value?.utmParams.utm_source`. Data is empty during server rendering; collection occurs in the browser after mounting. The server also renders the configured `trackingEnabled` value, while the browser loads any saved tracking preference. Wrap displays of browser history or the tracking preference in Nuxt’s `<ClientOnly>` to avoid hydration mismatches for returning visitors. Call `getAttribution()` from a client action after mounting, such as the form handler above.

## Tracking preferences and storage

To start with collection disabled, configure `utm: { trackingEnabled: false }`. Connect `enableTracking()` and `disableTracking()` to your application's preference controls. A previously saved browser preference takes precedence over the configured initial value. Disabling does not delete existing history; also call `clearData()` when deletion is intended.

Disabling tracking or clearing data cancels pending collection, including collection waiting on an asynchronous hook. Already completed application side effects cannot be undone.

If storage is blocked or full, the module keeps data in memory for the current page lifetime. `storageAvailable.value` becomes `false` if localStorage access fails. Memory-only history and preferences do not survive reloads. Clearing always removes in-memory data and attempts to remove persisted data, but a browser restriction can prevent that removal too. Invalid stored entries are ignored.

Browsers can also delete the history themselves. Safari deletes localStorage after seven days without a click, tap, or key press on your site ([tracking prevention](https://webkit.org/tracking-prevention/)), so a visitor who returns later starts with an empty history, and their lead loses the original first touch. Private windows discard history when they close. History belongs to one origin, so `www.example.com` and `example.com` keep separate histories.

If visitors often take longer than a week to convert, send the first touch to your server during the first visit, for example from a `utm:tracked` hook, and link it to the later lead with a cookie your server sets in its response. Safari's seven-day limit applies to storage written by scripts, not to cookies your own server sets. That cookie is also storage on the visitor's device, so the consent rules below apply to it.

## Privacy and consent

Nuxt UTM stores data only in the visitor's browser, for your site's origin. It sets no cookies, makes no network requests, and shares nothing across devices or unrelated domains. Data leaves the browser only when your application sends it.

| Storage        | Key                         | Contents                                                                               |
| -------------- | --------------------------- | -------------------------------------------------------------------------------------- |
| localStorage   | `nuxt-utm-data`             | The history, one entry per captured visit.                                             |
| sessionStorage | `nuxt-utm-session-id`       | A random ID, created when the tab's first visit is captured.                           |
| localStorage   | `nuxt-utm-tracking-enabled` | `true` or `false`, saved only when you call `enableTracking()` or `disableTracking()`. |

Each history entry holds:

- a timestamp and the session ID
- UTM and Google click parameters, and configured click IDs
- custom data from your hooks
- the referrer, user agent, browser language, and screen size
- the full landing-page URL, including its query string and fragment

The module reads its localStorage keys and applies retention when the app starts, even while tracking is disabled.

Whether you need consent depends on where your visitors are and what you use the data for. In the EU, [Article 5(3) of the ePrivacy Directive](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219) requires consent to store information on a visitor's device or read it, with narrow exceptions such as storage strictly necessary for a service the visitor explicitly requested. The EDPB's [Guidelines 2/2023](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en) explain that this covers more than cookies, and the UK ICO's [guidance on storage and access technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/) covers local storage under the UK rules. Data protection law such as the GDPR applies when the data is personal data. The GDPR's definition includes online identifiers, so stored click IDs can qualify before any form is submitted, and history submitted with a lead's contact details qualifies. This README is not legal advice.

To collect only after consent, start with tracking disabled as described in [Tracking preferences and storage](#tracking-preferences-and-storage), then connect the module to your consent tool:

```ts
// plugins/utm-consent.client.ts
import { hasConsent, onConsentChange } from '~/utils/consent'

export default defineNuxtPlugin((nuxtApp) => {
  const utm = useNuxtUTM()

  nuxtApp.hook('utm:before-track', (context) => {
    if (!hasConsent()) context.skip = true
  })

  onConsentChange((granted) => {
    if (granted) {
      utm.enableTracking()
    } else {
      utm.disableTracking()
      utm.clearData()
    }
  })
})
```

Replace `~/utils/consent` with your consent tool's API. A saved preference outlives consent that expires without a callback, so the hook checks consent on every capture. `enableTracking()` captures the current page only; campaign parameters from pages visited before consent are not recovered. If your consent UI shows `trackingEnabled`, see the `<ClientOnly>` note in [Composable](#composable).

To collect less:

- List in `clickParams` only the click IDs your consent policy covers.
- Set `captureWithoutCampaign: false` to skip visits without campaign parameters.
- Set `maxAge` and `maxEntries` to limit retention.
- Redact context you do not need in a `utm:before-persist` hook. Every query parameter, listed or not, stays in `additionalInfo.landingPageUrl` unless a hook removes it, as shown in [Hooks](#hooks).
- Avoid placing sensitive information in URLs or custom data.

## Hooks

| Hook                 | Receives                         | Use                                                                 |
| -------------------- | -------------------------------- | ------------------------------------------------------------------- |
| `utm:before-track`   | Mutable `{ route, query, skip }` | Set `skip = true` to skip collection, or adjust the captured query. |
| `utm:before-persist` | Mutable `DataObject`             | Enrich or redact an entry before validation and deduplication.      |
| `utm:tracked`        | Detached `DataObject`            | React after a new entry is saved, including in memory fallback.     |

Register application-wide hooks in a client plugin. Route and query information is captured when collection starts, so use that context or the entry's landing-page URL when enriching asynchronous captures:

```ts
// plugins/utm-hooks.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('utm:before-track', (context) => {
    if (context.route.path.startsWith('/admin')) context.skip = true
  })

  nuxtApp.hook('utm:before-persist', (data) => {
    const url = new URL(data.additionalInfo.landingPageUrl)
    const promo = url.searchParams.get('promo')
    if (promo) data.customParams = { ...data.customParams, promo }
    data.additionalInfo.landingPageUrl = `${url.origin}${url.pathname}`
  })
})
```

Custom fields must be JSON-serializable. Keep the required data shape intact when redacting it, for example replace a string with `''`. A failing before hook or invalid resulting entry skips that capture. Changes made by an after-save hook do not mutate retained history. `getAttribution()` waits for before hooks and persistence, but does not wait for after-save side effects.

Do not await `capture()` or `getAttribution()` inside a before hook: that would wait on the collection currently running the hook. Use the hook's input instead. Component hooks can be removed when their owner is disposed:

```ts
import { onScopeDispose } from 'vue'

const utm = useNuxtUTM()
const stop = utm.onBeforePersist((entry) => {
  entry.customParams = { ...entry.customParams, pageCategory: 'apartments' }
})
onScopeDispose(stop)
```

## Data and TypeScript

Each history entry has this shape:

```ts
import type { DataObject, AttributionSnapshot } from 'nuxt-utm'

const entry: DataObject = {
  timestamp: '2026-01-01T12:00:00.000Z',
  utmParams: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'apartments' },
  gclidParams: { gclid: 'example-click-id', gad_source: '1' },
  additionalInfo: {
    referrer: 'https://www.google.com/',
    userAgent: 'Example browser',
    language: 'en',
    landingPageUrl: 'https://example.com/?utm_source=google',
    screen: { width: 1280, height: 720 },
  },
  sessionId: 'example-session',
  customParams: { pageCategory: 'apartments' },
}

const attribution: AttributionSnapshot = {
  firstTouch: entry,
  lastTouch: entry,
  history: [entry],
}
```

Supported UTM fields are the manual campaign parameters Google Analytics 4 documents: `utm_id`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_source_platform`, `utm_term`, `utm_content`, `utm_creative_format`, and `utm_marketing_tactic`. Google click fields are `gclid`, `gad_source`, `gad_campaignid`, `gbraid`, `wbraid`, and `dclid`; Google Ads sends `gbraid` or `wbraid` alongside or instead of `gclid` for some iOS traffic. A nonempty value in any of these fields makes a visit a campaign visit. When a parameter repeats in the URL, each field, including configured click parameters, keeps its first nonempty value: `?utm_source=&utm_source=google&utm_source=newsletter` saves `google`. `clickParams` holds the values of the names listed in the `clickParams` option. `gclidParams`, `clickParams`, and `customParams` are optional. The package also exports `ModuleOptions`, `UTMParams`, `GCLIDParams`, `ClickParams`, `AdditionalInfo`, `BeforeTrackContext`, `NuxtUTMHooks`, and `UseNuxtUTMReturn`.

CI compiles the published declarations with TypeScript 5.9 and with the latest TypeScript 6 and 7 releases. Older TypeScript releases are untested.

## Development

Use the pnpm version pinned in `package.json`. The commands below assume Corepack is installed; see [pnpm installation](https://pnpm.io/installation) if needed.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev:prepare
pnpm playwright-core install chromium
pnpm lint
pnpm format:check
pnpm test:types
pnpm test
pnpm test:package
pnpm test:compatibility
NUXT_VERSION=3 pnpm test:compatibility
pnpm dev:build
```

`test:package` checks the actual npm tarball from an isolated TypeScript consumer. `test:compatibility` also installs it in an independent Nuxt app, checks types, builds and generates static pages, and exercises campaign navigation, reload persistence, and form submission in Chromium. It tests the latest Nuxt 4 release by default; set `NUXT_VERSION=3` for Nuxt 3 or `NUXT_VERSION=npm:nuxt-nightly@5x` for the Nuxt 5 nightly. CI runs all three separately from the Node 22, 24, and 26 checks, and a nightly failure does not fail the workflow. These are tested configurations, not runtime version restrictions.

Set `TYPESCRIPT_VERSION` to check the tarball with another TypeScript release, for example `TYPESCRIPT_VERSION=7 pnpm test:package`. Applications compile the published declarations with their own TypeScript, so CI also runs this check with each release listed in [Data and TypeScript](#data-and-typescript).

Use `pnpm dev` for the playground. See the [release documentation](docs/RELEASING.md) for preparing and publishing a version.

## License

MIT, see [LICENSE](LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-utm/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-utm
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-utm.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-utm
[license-src]: https://img.shields.io/npm/l/nuxt-utm.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-utm
[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com

---

<img src="https://www.stackbuilders.com/media/images/Sb-supports.original.png" alt="Stack Builders" width="50%"></img>
[Check out our libraries](https://github.com/stackbuilders/) | [Join our team](https://www.stackbuilders.com/join-us/)
