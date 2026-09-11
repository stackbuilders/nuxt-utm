import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createHooks } from 'hookable'
import type { NuxtApp, RuntimeNuxtHooks } from '#app'
import type { App, Ref } from 'vue'
import type { DataObject } from 'nuxt-utm'
import plugin from '../src/runtime/plugin'

const config = vi.hoisted(() => ({ public: { utm: { trackingEnabled: true } } }))
vi.mock('#app', () => ({
  defineNuxtPlugin: (setup: unknown) => setup,
  useRuntimeConfig: () => config,
  useRouter: () => ({ afterEach: vi.fn() }),
}))

const memoryStorage = (): Storage => {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size
    },
  }
}

const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

async function setupTracker() {
  const hooks = createHooks<RuntimeNuxtHooks>()
  const app = {
    _route: { path: '/', fullPath: '/?utm_source=google', query: { utm_source: 'google' } },
    hook: hooks.hook,
    callHook: hooks.callHook,
  } as unknown as NuxtApp
  const result = await plugin(app)
  const controls = result!.provide as {
    utm: Ref<readonly DataObject[]>
    utmDisableTracking: () => void
    utmEnableTracking: () => void
    utmClearData: () => void
  }
  return { hooks, controls, mount: () => hooks.callHook('app:mounted', {} as App) }
}

beforeEach(() => {
  vi.stubGlobal('window', { location: { href: 'https://example.com/?utm_source=google' } })
  vi.stubGlobal('localStorage', memoryStorage())
  vi.stubGlobal('sessionStorage', memoryStorage())
  vi.stubGlobal('document', { referrer: '' })
  vi.stubGlobal('navigator', { language: 'en', userAgent: 'test' })
  vi.stubGlobal('screen', { width: 1280, height: 720 })
})

afterEach(() => vi.unstubAllGlobals())

describe('tracking lifecycle', () => {
  for (const action of ['disable', 'clear'] as const) {
    for (const hook of ['utm:before-track', 'utm:before-persist'] as const) {
      it(`does not persist after ${action} while ${hook} is pending`, async () => {
        const { hooks, controls, mount } = await setupTracker()
        const entered = deferred()
        const resume = deferred()
        const tracked = vi.fn()
        hooks.hook(hook, async () => {
          entered.resolve()
          await resume.promise
        })
        hooks.hook('utm:tracked', tracked)

        const pending = mount()
        await entered.promise
        if (action === 'disable') controls.utmDisableTracking()
        else controls.utmClearData()
        resume.resolve()
        await pending

        expect(localStorage.getItem('nuxt-utm-data')).toBeNull()
        expect(controls.utm.value).toEqual([])
        expect(tracked).not.toHaveBeenCalled()
      })
    }
  }

  it('keeps tracking usable when storage access is blocked', async () => {
    const blocked = () => {
      throw new DOMException('Blocked', 'SecurityError')
    }
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked })
    vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked, removeItem: blocked })
    const { controls, mount } = await setupTracker()
    await mount()
    expect(controls.utm.value[0]?.utmParams.utm_source).toBe('google')
    controls.utmClearData()
    expect(controls.utm.value).toEqual([])
  })

  it('starts fresh tracking without waiting for a cancelled hook to finish', async () => {
    const { hooks, controls, mount } = await setupTracker()
    const entered = deferred()
    const resume = deferred()
    let firstCall = true
    hooks.hook('utm:before-persist', async () => {
      if (!firstCall) return
      firstCall = false
      entered.resolve()
      await resume.promise
    })

    const abandoned = mount()
    await entered.promise
    controls.utmDisableTracking()
    controls.utmClearData()
    controls.utmEnableTracking()
    await mount()
    expect(controls.utm.value).toHaveLength(1)
    const current = JSON.parse(JSON.stringify(controls.utm.value))

    resume.resolve()
    await abandoned
    expect(controls.utm.value).toEqual(current)
  })

  it('isolates collected data from mutations in after-save hooks', async () => {
    const { hooks, controls, mount } = await setupTracker()
    hooks.hook('utm:tracked', (entry) => {
      entry.utmParams.utm_source = 'mutated'
    })
    await mount()
    expect(controls.utm.value[0]?.utmParams.utm_source).toBe('google')
    expect(JSON.parse(localStorage.getItem('nuxt-utm-data')!)[0].utmParams.utm_source).toBe(
      'google',
    )
  })

  it('ignores valid JSON that is not tracking history', async () => {
    localStorage.setItem('nuxt-utm-data', '{}')
    const { controls, mount } = await setupTracker()
    await mount()
    expect(controls.utm.value).toHaveLength(1)
  })
})
