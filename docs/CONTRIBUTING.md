Thank you for your interest in contributing to this Stack Builders' library. To contribute, please take our [Code of Conduct](CODE_OF_CONDUCT.md) into account, along with the following recommendations:

- When submitting contributions to this repository, please make sure to discuss with the maintainer(s) the change you want to make. You can do this through an issue, or by sending an email to [community@stackbuilders.com](mailto:community@stackbuilders.com)

- Once the change has been discussed with the maintainer(s), feel free to open a Pull Request. Please include a link to the issue you're trying to solve, or a quick summary of the discussed changes.

- If adding any new features that you think should be considered in the README file, please add that information in your Pull Request.

- Once you get an approval from any of the maintainers, please merge your Pull Request. Keep in mind that some of our Stack Builders repositories use CI/CD pipelines, so you will need to pass all of the required checks before merging.

## Getting help

Contact any of our current maintainers, or send us an email at [community@stackbuilders.com](mailto:community@stackbuilders.com) for more information. Thank you for contributing!

## Local development

Use the pnpm version pinned in `package.json`. With Corepack installed, run `corepack enable`, then `pnpm install --frozen-lockfile` and `pnpm dev:prepare` from the repository root. The module and playground share `pnpm-lock.yaml`; install dependencies from the root and use `pnpm --dir playground build` to build the playground directly.

Before submitting a change, run `pnpm lint`, `pnpm format:check`, `pnpm test:types`, `pnpm test`, and `pnpm test:package`. Prettier owns formatting and ESLint checks everything else; `pnpm format` applies the formatting. For runtime changes, also run `pnpm test:compatibility` and `NUXT_VERSION=3 pnpm test:compatibility` to test independent consumers that are server-rendered, prerendered, and rendered only in the browser. `test/integration-rendering-modes.test.ts` covers the same three modes in `pnpm test`; extend it when a change affects when the module captures a visit.

Run `pnpm test:coverage` to see how much of `src/` the tests cover. It runs the same tests as `pnpm test`, prints a per-file table, and writes an HTML report to `coverage/index.html`. The numbers count only code that runs inside the Vitest process: the unit tests and the module setup that runs while fixtures build. Code that the integration tests exercise in the browser or in the fixture's Nuxt server is not counted, so runtime files such as `src/runtime/composables.ts` can show low coverage even when integration tests use them. Read uncovered lines in `src/runtime` as having no unit test, not as untested.
