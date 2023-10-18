# Repository Name

Quick summary about the repository or library. What is

## How it works / motivation / purpose

Promote the library/project explaining how it works. You can also add the motiviation for writing the library or explain its porpuse in this section.

## Install

Its a good idea to explain/show how to install the library/project. You can try to use badges of the package registry (NPM, MyPy, Stackage, Maven, etc) to always display the latest version so this section is easier to maintain.

## Usage

This section can show a quick start of the library/project. This helps developers quickly understand how the software is expected to be used, giving a great entry point to project as well. In this section you can also write the documentation for the end-user, or add a link to the docs if they are in some external source (the wiki, a dedicated page, the `docs/` folder, etc.).

<!-- Add any other required sections here as needed -->

## License

<!-- NOTE: If you need a different type of licence, please check with the OSS team before changing it -->

MIT, see [the LICENSE file](LICENSE).

## Contributing

Do you want to contribute to this project? Please take a look at our [contributing guideline](/docs/CONTRIBUTING.md) to know how you can help us build it.

---

<img src="https://www.stackbuilders.com/media/images/Sb-supports.original.png" alt="Stack Builders" width="50%"></img>
[Check out our libraries](https://github.com/stackbuilders/) | [Join our team](https://www.stackbuilders.com/join-us/)

<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: My Module
- Package name: my-module
- Description: My new Nuxt module
-->

# My Module

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

My new Nuxt module for doing amazing things.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
  <!-- - [🏀 Online playground](https://stackblitz.com/github/your-org/my-module?file=playground%2Fapp.vue) -->
  <!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

<!-- Highlight some of the features your module provide here -->

- ⛰ &nbsp;Foo
- 🚠 &nbsp;Bar
- 🌲 &nbsp;Baz

## Quick Setup

1. Add `my-module` dependency to your project

```bash
# Using pnpm
pnpm add -D my-module

# Using yarn
yarn add --dev my-module

# Using npm
npm install --save-dev my-module
```

2. Add `my-module` to the `modules` section of `nuxt.config.ts`

```js
export default defineNuxtConfig({
  modules: ["my-module"],
});
```

That's it! You can now use My Module in your Nuxt app ✨

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

# Run Vitest
npm run test
npm run test:watch

# Release new version
npm run release
```

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/my-module/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/my-module
[npm-downloads-src]: https://img.shields.io/npm/dm/my-module.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/my-module
[license-src]: https://img.shields.io/npm/l/my-module.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/my-module
[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
