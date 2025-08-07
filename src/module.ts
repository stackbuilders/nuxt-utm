import { defineNuxtModule, addPlugin, addImports, createResolver } from '@nuxt/kit'
import defu from 'defu'

// Module options TypeScript interface definition
export interface ModuleOptions {
  enabled?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'utm',
    configKey: 'utm',
  },
  // Default configuration options of the Nuxt module
  defaults: { enabled: true },
  setup(options, nuxt) {
    nuxt.options.runtimeConfig.public.utm = defu(nuxt.options.runtimeConfig.public.utm || {}, {
      enabled: options.enabled,
    })

    const resolver = createResolver(import.meta.url)

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugin'))
    addImports({
      name: 'useNuxtUTM',
      from: resolver.resolve('runtime/composables'),
    })
  },
})
