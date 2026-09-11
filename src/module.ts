import { defineNuxtModule, addPlugin, addImports, addTypeTemplate, createResolver } from '@nuxt/kit'
import type { ModuleOptions } from './runtime/types'

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
      nuxt: '^3.0.0 || ^4.0.0',
    },
  },
  defaults,
  setup(options, nuxt) {
    if (options.maxAge !== undefined && (!Number.isFinite(options.maxAge) || options.maxAge <= 0)) {
      throw new Error('[nuxt-utm] maxAge must be a positive number of seconds')
    }
    if (
      options.maxEntries !== undefined &&
      (!Number.isInteger(options.maxEntries) || options.maxEntries <= 0)
    ) {
      throw new Error('[nuxt-utm] maxEntries must be a positive integer')
    }
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
