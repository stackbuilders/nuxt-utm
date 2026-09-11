# Nuxt UTM

[![CI](https://github.com/stackbuilders/nuxt-utm/actions/workflows/main.yml/badge.svg)](https://github.com/stackbuilders/nuxt-utm/actions/workflows/main.yml)
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

**Built in collaboration with The Durst Organization**

Nuxt UTM keeps campaign information in the browser until your application is ready to use it. It was built for **statically generated Nuxt websites**: collect a visitor's source now, then include it with a lead, signup, or form submission later.

It supports Nuxt 3 and 4. Collection needs no backend, analytics account, or network request. Your application decides whether and when to send the data to its own API or CRM.

[Release notes](CHANGELOG.md) · [Contributing](docs/CONTRIBUTING.md)

## What is attribution?

Attribution connects an action, such as submitting a contact form, to the campaign that brought the visitor to your site.

For example, someone arrives from a Google campaign, returns through a newsletter, and later opens your contact page directly. Nuxt UTM can give your backend:

- **First touch:** the oldest retained campaign, Google in this example.
- **Last touch:** the most recent retained campaign, the newsletter.
- **History:** the retained visits, newest first, including direct visits by default.

First and last touch consider nonempty UTM or Google click parameters. Direct visits do not replace them; both are `null` when no campaign remains. Retention can remove the original first touch, so these values describe the history still available in this browser.

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

The module captures the initial page after the app mounts and saves its UTM parameters, Google click parameters, and visit context in localStorage. The same behavior works after `nuxt generate` with ordinary static hosting.

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

## Configuration

All new collection and retention options are opt-in. Existing behavior is preserved by default.

| Option                   | Default | Behavior                                                                     |
| ------------------------ | ------- | ---------------------------------------------------------------------------- |
| `trackingEnabled`        | `true`  | Initial tracking preference when no saved preference exists.                 |
| `trackOnRouteChange`     | `false` | Also capture successful client-side navigations whose full URL path changes. |
| `captureWithoutCampaign` | `true`  | Include visits without UTM or Google click parameters.                       |
| `maxAge`                 | Unset   | Retain entries younger than this many seconds. Must be positive and finite.  |
| `maxEntries`             | Unset   | Retain at most this many entries. Must be a positive integer.                |

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

Retention runs when history is loaded, a visit is saved, or `getAttribution()` is called. There is no background expiry timer. Without retention options, history has no configured age or entry limit.

Consecutive entries with the same UTM parameters, Google click parameters, and session ID are deduplicated. URLs, timestamps, and `customParams` do not participate in that comparison. This is not a pageview counter. The session ID uses sessionStorage for the current browser tab; it has no inactivity timeout.

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

Access refs with `.value` in script, for example `utm.lastTouch.value?.utmParams.utm_source`. Data is empty during server rendering; collection occurs in the browser after mounting. Wrap browser-history displays in Nuxt’s `<ClientOnly>` to avoid hydration mismatches when a returning visitor already has stored history. Call `getAttribution()` from a client action after mounting, such as the form handler above.

## Tracking preferences and storage

To start with collection disabled, configure `utm: { trackingEnabled: false }`. Connect `enableTracking()` and `disableTracking()` to your application's preference controls. A previously saved browser preference takes precedence over the configured initial value. Disabling does not delete existing history; also call `clearData()` when deletion is intended.

Disabling tracking or clearing data cancels pending collection, including collection waiting on an asynchronous hook. Already completed application side effects cannot be undone.

If storage is blocked or full, the module keeps data in memory for the current page lifetime. `storageAvailable.value` becomes `false` if localStorage access fails. Memory-only history and preferences do not survive reloads. Clearing always removes in-memory data and attempts to remove persisted data, but a browser restriction can prevent that removal too. Invalid stored entries are ignored.

History stays within the browser's storage for the site's origin. It is not shared across devices or unrelated domains. The module captures referrer, user agent, browser language, screen dimensions, and the full landing-page URL as well as campaign parameters. Use the hooks to remove context you do not need, and avoid placing sensitive information in URLs or custom data.

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
    const fbclid = url.searchParams.get('fbclid')
    if (fbclid) data.customParams = { ...data.customParams, fbclid }
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

Supported UTM fields are `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, and `utm_content`. Google fields are `gclid` and `gad_source`. `gclidParams` and `customParams` are optional. The package also exports `ModuleOptions`, `UTMParams`, `GCLIDParams`, `AdditionalInfo`, `BeforeTrackContext`, `NuxtUTMHooks`, and `UseNuxtUTMReturn`.

## Development

Use the pnpm version pinned in `package.json`. The commands below assume Corepack is installed; see [pnpm installation](https://pnpm.io/installation) if needed.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev:prepare
pnpm playwright-core install chromium
pnpm lint
pnpm test:types
pnpm test
pnpm test:package
pnpm test:compatibility
NUXT_VERSION=3 pnpm test:compatibility
pnpm dev:build
```

`test:package` checks the actual npm tarball from an isolated TypeScript consumer. `test:compatibility` also installs it in an independent Nuxt app, checks types, builds and generates static pages, and exercises campaign navigation, reload persistence, and form submission in Chromium. It tests the latest Nuxt 4 release by default; set `NUXT_VERSION=3` for Nuxt 3. CI runs both release lines separately from the Node 22, 24, and 26 checks. These are tested configurations, not runtime version restrictions.

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
