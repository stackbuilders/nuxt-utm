# Nuxt UTM

[![CI](https://github.com/stackbuilders/nuxt-utm/actions/workflows/main.yml/badge.svg)](https://github.com/stackbuilders/nuxt-utm/actions/workflows/main.yml)
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

**Built in collaboration with The Durst Organization**

---

A Nuxt 3/4 module for tracking UTM parameters.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
  <!-- - [🏀 Online playground](https://stackblitz.com/github/stackbuilders/nuxt-utm?file=playground%2Fapp.vue) -->
  <!-- - [📖 &nbsp;Documentation](https://example.com) -->

## How it works / motivation / purpose

If a visitor arrives at a website that uses the Nuxt UTM module and a UTM parameter is present in the URL, the module will collect the UTM parameters along with additional information. This information is saved in the device's local storage within the user's browser. This is especially useful for static generated websites that can later integrate with the backend to save this data. For example, when a visitor or lead submits a form, you can send this data alongside the form data. Later, this information can be especially useful for evaluating the effectiveness of ad campaigns and assessing their impact.

## Features

- **📍 UTM Tracking**: Easily capture UTM parameters to gain insights into traffic sources and campaign performance.
- **🔍 Intelligent De-duplication**: Smart recognition of page refreshes to avoid data duplication, ensuring each visit is uniquely accounted for.
- **🔗 Comprehensive Data Collection**: Alongside UTM parameters, gather additional context such as referrer details, user agent, landing page url, browser language, and screen resolution. This enriched data empowers your marketing strategies with a deeper understanding of campaign impact.
- **🔌 Hooks & Extensibility**: Three runtime hooks (`utm:before-track`, `utm:before-persist`, `utm:tracked`) let you skip tracking, enrich data with custom parameters, or trigger side effects after tracking completes.

## Quick Setup

1. Add `nuxt-utm` dependency to your project

```bash
# Using pnpm
pnpm add -D nuxt-utm

# Using yarn
yarn add --dev nuxt-utm

# Using npm
npm install --save-dev nuxt-utm
```

2. Add `nuxt-utm` to the `modules` section of `nuxt.config.ts`

```js
export default defineNuxtConfig({
  modules: ['nuxt-utm'],
})
```

That's it! You can now use Nuxt UTM in your Nuxt app ✨

## Usage

### Configuration

You can configure the module by passing options in your `nuxt.config.ts`:

```js
export default defineNuxtConfig({
  modules: ['nuxt-utm'],
  utm: {
    trackingEnabled: true, // defaults to true - initial tracking state
  },
})
```

#### Options

- `trackingEnabled`: Boolean (default: `true`) - Sets the initial state for UTM tracking. This can be changed at runtime.

### Runtime Tracking Control

The module provides runtime control over tracking, perfect for implementing cookie consent banners or user privacy preferences.

#### Using the Composable

```vue
<script setup>
const utm = useNuxtUTM()

// The composable returns:
// - data: Reactive array of collected UTM data
// - trackingEnabled: Reactive boolean indicating if tracking is active
// - enableTracking(): Enable UTM tracking
// - disableTracking(): Disable UTM tracking
// - clearData(): Clear all stored UTM data
// - onBeforeTrack(cb): Hook called before data collection
// - onBeforePersist(cb): Hook called to enrich/modify collected data before saving
// - onTracked(cb): Hook called after data is saved
</script>
```

#### Example: Cookie Banner Integration

```vue
<template>
  <div v-if="showBanner" class="cookie-banner">
    <p>We use tracking to improve your experience.</p>
    <button @click="acceptTracking">Accept</button>
    <button @click="rejectTracking">Reject</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const utm = useNuxtUTM()
const showBanner = ref(!utm.trackingEnabled.value)

const acceptTracking = () => {
  utm.enableTracking()
  showBanner.value = false
}

const rejectTracking = () => {
  utm.disableTracking()
  utm.clearData() // Optional: clear any existing data
  showBanner.value = false
}
</script>
```

#### Privacy Controls

```vue
<template>
  <div class="privacy-settings">
    <h3>Privacy Settings</h3>
    <label>
      <input type="checkbox" :checked="utm.trackingEnabled.value" @change="toggleTracking" />
      Enable UTM tracking
    </label>
    <button @click="utm.clearData" v-if="utm.data.value.length > 0">
      Clear tracking data ({{ utm.data.value.length }} entries)
    </button>
  </div>
</template>

<script setup>
const utm = useNuxtUTM()

const toggleTracking = (event) => {
  if (event.target.checked) {
    utm.enableTracking()
  } else {
    utm.disableTracking()
  }
}
</script>
```

### Accessing UTM Data

You can use `useNuxtUTM` composable to access the UTM data:

```vue
<script setup>
const utm = useNuxtUTM()

// Access the collected data
console.log(utm.data.value)
</script>
```

> Remember: You don't need to import the composable because Nuxt imports it automatically.

### Data Structure

The `data` property contains an array of UTM parameters collected. Each element in the array represents a set of UTM parameters collected from a URL visit, and is structured as follows

```json
[
  {
    "timestamp": "2023-11-02T10:11:17.219Z",
    "utmParams": {
      "utm_source": "test_source",
      "utm_medium": "test_medium",
      "utm_campaign": "test_campaign",
      "utm_term": "test_term",
      "utm_content": "test_content"
    },
    "additionalInfo": {
      "referrer": "http://referrer.url",
      "userAgent": "User-Agent String",
      "language": "en-GB",
      "landingPageUrl": "http://landingpage.url",
      "screen": {
        "width": 1728,
        "height": 1117
      }
    },
    "sessionId": "beai1gx7dg",
    "gclidParams": {
      "gclid": "CjklsefawEFRfeafads",
      "gad_source": "1"
    },
    "customParams": {
      "fbclid": "abc123"
    }
  }
]
```

Each entry provides a `timestamp` indicating when the UTM parameters were collected, the `utmParams` object containing the UTM parameters, `additionalInfo` object with more context about the visit, and a `sessionId` to differentiate visits in different sessions.

### Key Features

- **Runtime Control**: Enable/disable tracking dynamically based on user consent
- **Privacy Friendly**: Respects user preferences and provides clear data management
- **Persistent Preferences**: Tracking preferences are saved and persist across sessions
- **Data Clearing**: Ability to completely remove all collected data
- **Session Management**: Automatically manages sessions to avoid duplicate tracking

### Hooks

The module provides three runtime hooks that let you extend the tracking pipeline. You can use them to skip tracking, enrich data with custom parameters, or trigger side effects after tracking completes. Hooks can be registered via a Nuxt plugin or through the `useNuxtUTM` composable.

This keeps your tracking strategy flexible: enrich once in your app, then forward the same enriched payload wherever you need it.

#### Available Hooks

| Hook               | When it fires                          | Receives                                        | Purpose                                              |
| ------------------ | -------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| `utm:before-track` | Before data collection                 | `BeforeTrackContext` (`{ route, query, skip }`) | Conditionally skip tracking by setting `skip = true` |
| `utm:before-persist` | After data is collected, before saving | `DataObject` (mutable)                        | Enrich or modify the data, add `customParams`        |
| `utm:tracked`      | After data is saved to localStorage    | `DataObject` (final)                            | Side effects: send to API, fire analytics, log       |

#### Registering Hooks via Plugin

Create a Nuxt plugin to register hooks that run on every page visit:

```typescript
// plugins/utm-hooks.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  // Skip tracking on admin pages
  nuxtApp.hook('utm:before-track', (context) => {
    if (context.route.path.startsWith('/admin')) {
      context.skip = true
    }
  })

  // Add custom marketing parameters
  nuxtApp.hook('utm:before-persist', (data) => {
    const query = nuxtApp._route.query
    if (query.fbclid) {
      data.customParams = {
        ...data.customParams,
        fbclid: String(query.fbclid),
      }
    }
    if (query.msclkid) {
      data.customParams = {
        ...data.customParams,
        msclkid: String(query.msclkid),
      }
    }
  })

  // Send data to your backend after tracking
  nuxtApp.hook('utm:tracked', async (data) => {
    await $fetch('/api/marketing/track', {
      method: 'POST',
      body: data,
    })
  })
})
```

#### Registering Hooks via Composable

The `useNuxtUTM` composable provides convenience methods for registering hooks. Each method returns a cleanup function to unregister the hook.

```vue
<script setup>
const utm = useNuxtUTM()

// Register a before-persist hook
const cleanup = utm.onBeforePersist((data) => {
  data.customParams = { ...data.customParams, source: 'vue-component' }
})

// Unregister when no longer needed
// cleanup()
</script>
```

#### Example: add `pageCategory`

Use `utm:before-persist` to enrich every tracked event with a normalized `pageCategory`. This pattern is useful when you want one internal taxonomy that can be reused across your app and backend.

```typescript
// plugins/utm-page-category.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('utm:before-persist', (data) => {
    const url = new URL(data.additionalInfo.landingPageUrl)
    const explicitCategory = url.searchParams.get('page_category')

    // Optional fallback categorization from pathname
    const fallbackCategory = url.pathname.startsWith('/pricing') ? 'pricing' : 'general'

    data.customParams = {
      ...data.customParams,
      pageCategory: explicitCategory ?? fallbackCategory,
    }
  })
})
```

Tracked data will include:

```json
{
  "customParams": {
    "pageCategory": "pricing"
  }
}
```

#### Hook: `utm:before-track`

Called before any data collection begins. The handler receives a `BeforeTrackContext` object with `route`, `query`, and a `skip` flag. Set `skip = true` to prevent tracking for the current page visit.

```typescript
nuxtApp.hook('utm:before-track', (context) => {
  // context.route - the current route object
  // context.query - the current URL query parameters
  // context.skip  - set to true to skip tracking
})
```

#### Hook: `utm:before-persist`

Called after the `DataObject` is built but before it is checked for duplicates and saved. The handler receives the `DataObject` directly and can mutate it to add or modify fields. This is the primary hook for adding `customParams`.

```typescript
nuxtApp.hook('utm:before-persist', (data) => {
  // Add any custom tracking parameters
  data.customParams = {
    ...data.customParams,
    myCustomField: 'value',
  }
})
```

> Note: `customParams` are not included in the de-duplication check. Only UTM parameters, GCLID parameters, and session ID are compared.

#### Hook: `utm:tracked`

Called after data is saved to localStorage. The handler receives the final `DataObject`. Use this for side effects like sending data to a backend or triggering analytics events.

```typescript
nuxtApp.hook('utm:tracked', async (data) => {
  console.log('Tracked:', data.utmParams, data.customParams)
})
```

## Development

```bash
# Install dependencies
yarn install

# Generate type stubs
yarn dev:prepare

# Develop with the playground
yarn dev

# Build the playground
yarn dev:build

# Run ESLint
yarn lint

# Install Playwright Browsers
npx playwright install --with-deps

# Run Vitest
yarn test
yarn test:watch

# Release new version
yarn release
```

For detailed information about the release process, please refer to our [Release Documentation](/docs/RELEASING.md).

## License

<!-- NOTE: If you need a different type of licence, please check with the OSS team before changing it -->

MIT, see [the LICENSE file](LICENSE).

## Contributing

Do you want to contribute to this project? Please take a look at our [contributing guideline](/docs/CONTRIBUTING.md) to know how you can help us build it.

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
