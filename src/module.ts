import { defineNuxtModule, addPlugin, addImports, addTypeTemplate, createResolver } from '@nuxt/kit'
import type { ModuleOptions } from './runtime/types'
import { validateOptions } from './options'

export type {
  ModuleOptions,
  UTMParams,
  GCLIDParams,
  AdditionalInfo,
  DataObject,
  BeforeTrackContext,
  NuxtUTMHooks,
  AttributionSnapshot,
} from './runtime/types'
export type { UseNuxtUTMReturn } from './runtime/composables'

const defaults = {
  trackingEnabled: true,
  trackOnRouteChange: false,
  captureWithoutCampaign: true,
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'utm',
    configKey: 'utm',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults,
  setup(options, nuxt) {
    validateOptions(options)
    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.utm = {
      ...defaults,
      ...options,
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
