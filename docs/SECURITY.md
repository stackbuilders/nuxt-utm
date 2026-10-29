# Security policy

## Reporting a vulnerability

Please report security issues privately through [GitHub's private vulnerability reporting](https://github.com/stackbuilders/nuxt-utm/security/advisories/new), not in a public issue or pull request. If you can't use GitHub, email [community@stackbuilders.com](mailto:community@stackbuilders.com) and we'll arrange a private channel.

A useful report includes the affected `nuxt-utm` version, the Nuxt version and rendering mode (server-rendered, prerendered, or browser-only), the steps or a minimal app that reproduces the issue, and what an attacker could achieve.

We'll confirm the report, work on a fix with you privately, and publish a GitHub security advisory with credit to you, unless you prefer to stay anonymous, once a fixed release is on npm.

## Supported versions

Fixes ship in a new release of the latest version. Please upgrade to the latest release before reporting; earlier releases don't receive backports.

## Scope

The npm package contains only the built module and depends only on `@nuxt/kit`. Vulnerabilities in the development tooling in this repository, such as the playground, test fixtures, or CI dependencies, don't affect applications that install `nuxt-utm`; you can still report them the same way.
