# Nuxt UTM

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]
[![CI](https://github.com/stackbuilders/nuxt-utm/actions/workflows/main.yml/badge.svg)](https://github.com/stackbuilders/nuxt-utm/actions/workflows/main.yml)

A [Nuxt 3](https://nuxt.com) module for tracking UTM parameters.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
<!-- - [🏀 Online playground](https://stackblitz.com/github/your-org/my-module?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

- ✅ Automatically capture UTM parameters from URL query strings
- ✅ Store UTM data persistently in localStorage with session tracking  
- ✅ Support for Google Ads parameters (gclid, gad_source)
- ✅ Additional context (referrer, user agent, screen size, landing page)
- ✅ TypeScript support
- ✅ **Enable/disable tracking via configuration or runtime**
- ✅ Composable API for easy access

## Quick Setup

1. Add `nuxt-utm` dependency to your project

```bash
# Using npm
npm install --save-dev nuxt-utm

# Using yarn
yarn add --dev nuxt-utm

# Using pnpm
pnpm add -D nuxt-utm
```

2. Add `nuxt-utm` to the `modules` section of `nuxt.config.ts`

```js
export default defineNuxtConfig({
  modules: ['nuxt-utm'],
  utm: {
    enabled: true, // Set to false to disable capturing UTM parameters
  },
})
```

## Configuration

### Module Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable or disable UTM parameter tracking |

Example configurations:

```js
// Disable UTM tracking completely
export default defineNuxtConfig({
  modules: ['nuxt-utm'],
  utm: {
    enabled: false,
  },
})

// Enable UTM tracking (default behavior)
export default defineNuxtConfig({
  modules: ['nuxt-utm'],
  utm: {
    enabled: true,
  },
})
```

## Usage

### Basic Usage

You can use `useNuxtUTM` composable to access the UTM object:

```vue
<script setup>
const { data, enabled, clear } = useNuxtUTM()

// Access UTM data
console.log(data.value) // Array of UTM data objects

// Check if tracking is enabled
console.log(enabled.value) // boolean

// Disable tracking at runtime (e.g., when user opts out)
enabled.value = false

// Re-enable tracking
enabled.value = true

// Clear all UTM data
clear()
</script>
```

### Alternative Access via Nuxt App

Alternatively, you can get the UTM information through the Nuxt App:

```vue
<script setup>
import { useNuxtApp } from 'nuxt/app'
const { $utm } = useNuxtApp()
const { data, enabled, clear } = $utm

// Disable tracking
$utm.enabled.value = false

// Clear all data
$utm.clear()
</script>
```

### Runtime Tracking Control

The module provides runtime control over UTM tracking, which is useful for implementing user consent flows:

```vue
<template>
  <div>
    <h1>Privacy Settings</h1>
    <label>
      <input 
        type="checkbox" 
        v-model="trackingEnabled"
        @change="handleTrackingToggle"
      >
      Allow UTM tracking
    </label>
    
    <div v-if="trackingEnabled">
      <h2>Current UTM Data</h2>
      <pre>{{ utmData }}</pre>
    </div>
  </div>
</template>

<script setup>
const { data: utmData, enabled, clear } = useNuxtUTM()

const trackingEnabled = ref(enabled.value)

const handleTrackingToggle = () => {
  enabled.value = trackingEnabled.value
  
  // Optionally clear existing data when disabled
  if (!trackingEnabled.value) {
    clear()
  }
}
</script>
```

## Data Structure

Regardless of the option you choose to use the module, the `data` will contain an array of UTM parameters collected for use. Each element in the array represents a set of UTM parameters collected from a URL visit, and is structured as follows:

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
    }
  }
]
```

In the `data` array, each entry provides:
- **timestamp**: When the UTM parameters were collected
- **utmParams**: The UTM parameters from the URL
- **additionalInfo**: Context about the visit (referrer, user agent, etc.)
- **sessionId**: Unique identifier for the user session
- **gclidParams**: Google Ads click identifier and source (if present)

## Common Use Cases

### GDPR/Privacy Compliance

```vue
<script setup>
const { enabled, clear } = useNuxtUTM()

// Check user's consent from your privacy management system
const hasConsent = await checkUserConsent()
enabled.value = hasConsent

// Listen for consent changes
onConsentChange((newConsent) => {
  enabled.value = newConsent
  if (!newConsent) {
    // Clear existing UTM data using the built-in clear function
    clear()
  }
})
</script>
```

### Conditional Tracking by Environment

```js
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-utm'],
  utm: {
    // Only enable in production
    enabled: process.env.NODE_ENV === 'production',
  },
})
```

### A/B Testing with Tracking Control

```vue
<script setup>
const { enabled } = useNuxtUTM()

// Enable tracking only for certain user segments
const userSegment = await getUserSegment()
enabled.value = userSegment === 'tracking-enabled'
</script>
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
