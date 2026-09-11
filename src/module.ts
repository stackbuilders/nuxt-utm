import { defineNuxtModule, addPlugin, addImports, addTypeTemplate, createResolver } from '@nuxt/kit'

export type {
  UTMParams, GCLIDParams, AdditionalInfo, DataObject, BeforeTrackContext, NuxtUTMHooks,
} from './runtime/types'
export type { UseNuxtUTMReturn } from './runtime/composables'

export interface ModuleOptions {
  trackingEnabled?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'utm',
    configKey: 'utm',
    compatibility: {
      nuxt: '^3.0.0 || ^4.0.0',
    },
  },
  defaults: {
    trackingEnabled: true,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.utm = {
      trackingEnabled: options.trackingEnabled ?? true,
    }

    addPlugin(resolver.resolve('./runtime/plugin'))
    addImports({
      name: 'useNuxtUTM',
      from: resolver.resolve('runtime/composables'),
    })

    addTypeTemplate({
      filename: 'types/utm-hooks.d.ts',
      getContents: () =>
        [
          `import type { NuxtUTMHooks } from ${JSON.stringify(resolver.resolve('./runtime/types'))}`,
          'declare module "#app" {',
          '  interface RuntimeNuxtHooks extends NuxtUTMHooks {}',
          '}',
        ].join('\n'),
    })
  },
})
