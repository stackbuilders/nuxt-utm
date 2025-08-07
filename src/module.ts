import { defineNuxtModule, addPlugin, addImports, createResolver } from '@nuxt/kit'

// Module options TypeScript interface definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface ModuleOptions {}
/* eslint-enable @typescript-eslint/no-empty-object-type */

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'utm',
    configKey: 'utm',
    compatibility: {
      nuxt: '^3.0.0 || ^4.0.0',
    },
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  setup() {
    const resolver = createResolver(import.meta.url)

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugin'))
    addImports({
      name: 'useNuxtUTM',
      from: resolver.resolve('runtime/composables'),
    })
  },
})
