// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Rules for formatting
    stylistic: true,
  },
  dirs: {
    src: ['./playground'],
  },
}).append({
  rules: {
    '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
    '@stylistic/semi': ['error', 'never'],
    '@stylistic/comma-dangle': ['error', 'always-multiline'],
    '@stylistic/operator-linebreak': 'off',
    '@stylistic/brace-style': 'off',
    '@stylistic/indent-binary-ops': 'off',
    '@stylistic/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'none',
          requireLast: false,
        },
        singleline: {
          delimiter: 'comma',
          requireLast: false,
        },
      },
    ],
  },
})
