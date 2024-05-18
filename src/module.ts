import {
  defineNuxtModule,
  addPlugin,
  addImports,
  createResolver,
} from "@nuxt/kit";

export interface ModuleOptions {
  enabled: boolean;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "utm",
    configKey: "utm",
  },
  defaults: {
    enabled: true,
  },
  setup(options) {
    const resolver = createResolver(import.meta.url);

    if (options.enabled) {
      // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
      addPlugin(resolver.resolve("./runtime/plugin"));
      addImports({
        name: "useNuxtUTM",
        from: resolver.resolve("runtime/composables"),
      });
    }
  },
});
