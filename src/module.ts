import { defineNuxtModule, addPlugin, addImports, addTypeTemplate, createResolver } from '@nuxt/kit'

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
          'import type { DataObject, BeforeTrackContext } from "nuxt-utm"',
          '',
          'declare module "#app" {',
          '  interface RuntimeNuxtHooks {',
          '    "utm:before-track": (context: BeforeTrackContext) => void | Promise<void>',
          '    "utm:before-persist": (data: DataObject) => void | Promise<void>',
          '    "utm:tracked": (data: DataObject) => void | Promise<void>',
          '  }',
          '}',
        ].join('\n'),
    })
  },
})
