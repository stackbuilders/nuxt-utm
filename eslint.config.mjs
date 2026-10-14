// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import prettier from 'eslint-config-prettier/flat'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Prettier formats the code, so the key order rule that came with stylistic is enabled on its own
    nuxt: { sortConfigKeys: true },
  },
  dirs: {
    src: ['./playground'],
  },
}).append(prettier, {
  // eslint-config-prettier turns this off, but without semicolons it is the rule that catches
  // a new line silently continuing the previous statement
  rules: { 'no-unexpected-multiline': 'error' },
})
