# Nuxt UTM

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A Nuxt 3 module for tracking UTM parameters.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
  <!-- - [🏀 Online playground](https://stackblitz.com/github/stackbuilders/nuxt-utm?file=playground%2Fapp.vue) -->
  <!-- - [📖 &nbsp;Documentation](https://example.com) -->

## How it works / motivation / purpose

If a visitor arrives at a website that uses the Nuxt UTM module and a UTM parameter is present in the URL, the module will collect the UTM parameters along with additional information. This information is saved in the device's local storage within the user's browser. This is especially useful for static generated websites that can later integrate with the backend to save this data. For example, when a visitor or lead submits a form, you can send this data alongside the form data. Later, this information can be especially useful for evaluating the effectiveness of ad campaigns and assessing their impact.

## Features

- **📍 UTM Tracking**: Easily capture UTM parameters to gain insights into traffic sources and campaign performance.
- **🔍 Intelligent De-duplication**: Smart recognition of page refreshes to avoid data duplication, ensuring each visit is uniquely accounted for.
- **🔗 Comprehensive Data Collection**: Alongside UTM parameters, gather additional context such as referrer details, user agent, browser language, and screen resolution. This enriched data empowers your marketing strategies with a deeper understanding of campaign impact.

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
  modules: ["nuxt-utm"],
});
```

That's it! You can now use Nuxt UTM in your Nuxt app ✨

## Usage

```vue
<script setup>
import { useNuxtApp } from "nuxt/app";
const { $utm } = useNuxtApp();
</script>
```

The `$utm` will contain an array of UTM parameters collected for use. Each element in the array represents a set of UTM parameters collected from a URL visit, and is structured as follows:

```js
[
  {
    timestamp: "2023-11-02T10:11:17.219Z", // Timestamp of the URL visit
    utmParams: {
      utm_source: "test_source",
      utm_medium: "test_medium",
      utm_campaign: "test_campaign",
      utm_term: "test_term",
      utm_content: "test_content",
    },
    additionalInfo: {
      referrer: "http://referrer.url", // Referrer URL
      userAgent: "User-Agent String", // User-Agent string of the browser
      language: "en-GB", // Language setting of the browser
      screen: {
        width: 1728,
        height: 1117,
      },
    },
    sessionId: "beai1gx7dg",
  }, // the first item in this array is the most recent
  // ... old items
];
```

In the `$utm` array, each entry provides a `timestamp` indicating when the UTM parameters were collected, the `utmParams` object containing the UTM parameters, `additionalInfo` object with more context about the visit, and a `sessionId` to differentiate visits in different sessions.

## Development

```bash
# Install dependencies
npm install

# Generate type stubs
npm run dev:prepare

# Develop with the playground
npm run dev

# Build the playground
npm run dev:build

# Run ESLint
npm run lint

# Install Playwright Browsers
npx playwright install --with-deps

# Run Vitest
npm run test
npm run test:watch

# Release new version
npm run release
```

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
