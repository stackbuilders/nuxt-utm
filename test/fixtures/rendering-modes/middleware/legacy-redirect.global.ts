import { defineNuxtRouteMiddleware, navigateTo } from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.client && to.path.startsWith('/legacy')) return navigateTo('/ssr')
})
