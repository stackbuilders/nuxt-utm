import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadNuxt, logger } from '@nuxt/kit'

describe('Module setup', () => {
  it('warns about a click parameter that matches a known click ID only by case', async () => {
    const warnings: string[] = []
    const reporter: Parameters<typeof logger.addReporter>[0] = {
      log: ({ tag, type, args }) => {
        if (tag === 'nuxt-utm' && type === 'warn') warnings.push(args.join(' '))
      },
    }

    logger.addReporter(reporter)
    try {
      const nuxt = await loadNuxt({
        cwd: fileURLToPath(new URL('./fixtures/click-param-warnings', import.meta.url)),
      })
      await nuxt.close()
    } finally {
      logger.removeReporter(reporter)
    }

    expect(warnings).toEqual([
      'clickParams lists sccid; did you mean ScCid? Query parameter names are case-sensitive',
    ])
  })
})
