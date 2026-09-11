import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createHooks } from 'hookable'
import type { NuxtApp, RuntimeNuxtHooks } from '#app'
import type { App, Ref } from 'vue'
import type { DataObject, AttributionSnapshot, ModuleOptions } from 'nuxt-utm'
import plugin from '../src/runtime/plugin'

const config = vi.hoisted(() => ({ public: { utm: {} as ModuleOptions } }))
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
    utmCapture: () => Promise<void>
    utmGetAttribution: () => Promise<AttributionSnapshot>
    utmDisableTracking: () => void
    utmEnableTracking: () => void
    utmClearData: () => void
  }
  return { app, hooks, controls, mount: () => hooks.callHook('app:mounted', {} as App) }
}

beforeEach(() => {
  config.public.utm = {
    trackingEnabled: true,
    captureWithoutCampaign: true,
    trackOnRouteChange: false,
  }
  vi.stubGlobal('window', { location: { href: 'https://example.com/?utm_source=google' } })
  vi.stubGlobal('localStorage', memoryStorage())
  vi.stubGlobal('sessionStorage', memoryStorage())
  vi.stubGlobal('document', { referrer: '' })
  vi.stubGlobal('navigator', { language: 'en', userAgent: 'test' })
  vi.stubGlobal('screen', { width: 1280, height: 720 })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

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

describe('attribution snapshots', () => {
  it('waits for pending enrichment before returning a detached payload', async () => {
    const { hooks, controls, mount } = await setupTracker()
    const entered = deferred()
    const resume = deferred()
    hooks.hook('utm:before-persist', async (entry) => {
      entered.resolve()
      await resume.promise
      entry.customParams = { lead: 'enriched' }
    })
    const mounted = mount()
    await entered.promise
    const completed = vi.fn()
    const payload = controls.utmGetAttribution().then((snapshot) => {
      completed()
      return snapshot
    })
    await Promise.resolve()
    expect(completed).not.toHaveBeenCalled()
    resume.resolve()
    const snapshot = await payload
    await mounted
    expect(snapshot.lastTouch?.customParams).toEqual({ lead: 'enriched' })
    snapshot.history[0]!.utmParams.utm_source = 'changed'
    expect(controls.utm.value[0]?.utmParams.utm_source).toBe('google')
  })

  it('allows after-save hooks to read attribution without waiting for themselves', async () => {
    const { hooks, controls, mount } = await setupTracker()
    const received: AttributionSnapshot[] = []
    hooks.hook('utm:tracked', async () => {
      received.push(await controls.utmGetAttribution())
    })
    await mount()
    expect(received[0]?.lastTouch?.utmParams.utm_source).toBe('google')
  })

  it('resolves a waiting payload when collection is cancelled', async () => {
    const { hooks, controls, mount } = await setupTracker()
    const entered = deferred()
    const resume = deferred()
    hooks.hook('utm:before-persist', async () => {
      entered.resolve()
      await resume.promise
    })
    const mounted = mount()
    await entered.promise
    const snapshot = controls.utmGetAttribution()
    controls.utmClearData()
    expect(await snapshot).toEqual({ firstTouch: null, lastTouch: null, history: [] })
    resume.resolve()
    await mounted
  })

  it('retains campaign touches through direct visits and supports manual capture', async () => {
    const { app, controls, mount } = await setupTracker()
    await mount()
    Object.assign(app._route, {
      fullPath: '/?utm_source=newsletter',
      query: { utm_source: 'newsletter' },
    })
    await controls.utmCapture()
    Object.assign(app._route, { fullPath: '/contact', query: {} })
    await controls.utmCapture()
    const snapshot = await controls.utmGetAttribution()
    expect(snapshot.history).toHaveLength(3)
    expect(snapshot.firstTouch?.utmParams.utm_source).toBe('google')
    expect(snapshot.lastTouch?.utmParams.utm_source).toBe('newsletter')
    expect(snapshot.history[0]?.additionalInfo.landingPageUrl).toBe('https://example.com/contact')
  })

  it('can capture only campaign visits', async () => {
    config.public.utm.captureWithoutCampaign = false
    const { app, controls, mount } = await setupTracker()
    Object.assign(app._route, { fullPath: '/contact', query: {} })
    await mount()
    expect(controls.utm.value).toEqual([])
    Object.assign(app._route, { fullPath: '/?gclid=click', query: { gclid: 'click' } })
    await controls.utmCapture()
    expect((await controls.utmGetAttribution()).lastTouch?.gclidParams?.gclid).toBe('click')
  })

  it('applies retention on collection, reload, and payload preparation', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    config.public.utm.maxEntries = 1
    const { app, controls, mount } = await setupTracker()
    await mount()
    Object.assign(app._route, {
      fullPath: '/?utm_source=newsletter',
      query: { utm_source: 'newsletter' },
    })
    await controls.utmCapture()
    expect(controls.utm.value).toHaveLength(1)
    expect((await controls.utmGetAttribution()).firstTouch?.utmParams.utm_source).toBe('newsletter')
    config.public.utm.maxAge = 60
    const reloaded = await setupTracker()
    expect(reloaded.controls.utm.value).toHaveLength(1)
    vi.setSystemTime(new Date('2026-01-01T00:01:00Z'))
    expect((await reloaded.controls.utmGetAttribution()).history).toEqual([])
    expect(localStorage.getItem('nuxt-utm-data')).toBeNull()
    expect((await setupTracker()).controls.utm.value).toEqual([])
  })
})
