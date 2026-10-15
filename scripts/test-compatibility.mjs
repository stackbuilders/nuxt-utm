import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { cpSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join, extname } from 'node:path'
import { chromium } from 'playwright'

export async function testCompatibility({ root, directory, tarball }) {
  const version = process.env.NUXT_VERSION ?? '4'
  const pnpmCommand = process.env.npm_execpath ? process.execPath : 'pnpm'
  const pnpmArguments = process.env.npm_execpath ? [process.env.npm_execpath] : []
  const { packageManager } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const fixture = join(directory, 'app')
  cpSync(join(root, 'test/package-fixture/app'), fixture, { recursive: true })
  for (const entry of readdirSync(fixture, { recursive: true })) {
    if (entry.endsWith('.template'))
      renameSync(join(fixture, entry), join(fixture, entry.slice(0, -9)))
  }
  writeFileSync(
    join(fixture, 'package.json'),
    JSON.stringify({
      name: 'nuxt-utm-compatibility',
      private: true,
      type: 'module',
      packageManager,
      dependencies: { nuxt: version, 'nuxt-utm': `file:${tarball}`, vue: '^3.5.0' },
      devDependencies: { typescript: '~5.9.3', 'vue-tsc': '^3.3.8' },
    }),
  )
  writeFileSync(
    join(fixture, 'tsconfig.json'),
    JSON.stringify({ extends: './.nuxt/tsconfig.json' }),
  )
  const run = (args) =>
    execFileSync(pnpmCommand, [...pnpmArguments, ...args], {
      cwd: fixture,
      stdio: 'inherit',
      timeout: 300_000,
      env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' },
    })
  const allowBuilds = JSON.parse(
    execFileSync(pnpmCommand, [...pnpmArguments, 'config', 'get', 'allowBuilds', '--json'], {
      cwd: root,
      encoding: 'utf8',
    }),
  )
  writeFileSync(join(fixture, 'pnpm-workspace.yaml'), JSON.stringify({ allowBuilds }))
  run(['install', '--no-frozen-lockfile'])
  const installed = JSON.parse(
    readFileSync(join(fixture, 'node_modules/nuxt/package.json'), 'utf8'),
  )
  console.log(`Testing published package with Nuxt ${installed.version}`)
  run(['exec', 'nuxt', 'prepare'])
  run(['exec', 'vue-tsc', '--noEmit'])
  run(['exec', 'nuxt', 'build'])
  const landingResults = await visitBuiltLandingPages(fixture, ['ssr', 'client'])
  run(['exec', 'nuxt', 'generate'])

  const publicDirectory = join(fixture, '.output/public')
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
  }
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://localhost').pathname
      let file = join(publicDirectory, pathname)
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
      response.setHeader('Content-Type', contentTypes[extname(file)] ?? 'application/octet-stream')
      response.end(await readFile(file))
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  let browser
  try {
    browser = await chromium.launch()
    landingResults.push(await visitLandingPage(browser, origin, 'static'))
    const html = await (await fetch(`${origin}/contact`)).text()
    assert.match(html, /Contact us/)
    const page = await browser.newPage()
    page.setDefaultTimeout(15_000)
    const errors = collectPageErrors(page)
    const submissions = []
    await page.route('**/api/leads', async (route) => {
      submissions.push(route.request().postDataJSON())
      await route.fulfill({
        status: submissions.length === 1 ? 503 : 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: submissions.length > 1 }),
      })
    })
    await page.goto(`${origin}/?utm_source=google&utm_medium=cpc`)
    await page.getByTestId('source').filter({ hasText: 'google' }).waitFor()
    await page.getByRole('link', { name: 'Newsletter contact link' }).click()
    await page.getByTestId('source').filter({ hasText: 'newsletter' }).waitFor()
    assert.equal(submissions.length, 0)
    await page.goto(`${origin}/contact`)
    await page.getByTestId('history-count').filter({ hasText: '3' }).waitFor()
    await page.reload()
    await page.getByTestId('source').filter({ hasText: 'newsletter' }).waitFor()
    assert.equal(submissions.length, 0)
    await page.getByLabel('Email').fill('visitor@example.com')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'Please try again' }).waitFor()
    assert.equal(submissions.length, 1)
    assert.equal(
      await page
        .getByTestId('history-count')
        .textContent()
        .then((text) => text.trim()),
      '3',
    )
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'Sent' }).waitFor()
    assert.equal(submissions.length, 2)
    assert.deepEqual(submissions[1], submissions[0])
    const [{ email, attribution }] = submissions
    assert.equal(email, 'visitor@example.com')
    assert.equal(attribution.firstTouch.utmParams.utm_source, 'google')
    assert.equal(attribution.lastTouch.utmParams.utm_source, 'newsletter')
    assert.equal(attribution.history.length, 3)
    assert.deepEqual(
      attribution.history.map((entry) => entry.customParams.page),
      ['/contact', '/contact', '/'],
    )
    assert.deepEqual(attribution.history[0].utmParams, {})
    assert.equal(
      new URL(attribution.lastTouch.additionalInfo.landingPageUrl).searchParams.get('utm_source'),
      'newsletter',
    )
    assert.deepEqual(errors, [])
    assert.deepEqual(
      landingResults,
      landingResults.map(({ mode }) => {
        const landingPage = `/landing/${mode}?utm_source=${mode}`
        return {
          mode,
          storedLandingPages: [landingPage],
          landingPagesOnMount: [landingPage],
          errors: [],
        }
      }),
    )
    console.log(
      `Nuxt ${installed.version}: package types, build, generate, landing pages, navigation, reload, and form attribution passed`,
    )
  } finally {
    await browser?.close()
    await new Promise((resolve) => server.close(resolve))
  }
}

async function visitBuiltLandingPages(fixture, modes) {
  const appServer = await startAppServer(fixture)
  const browser = await chromium.launch().catch((error) => {
    appServer.stop()
    throw error
  })
  try {
    const results = []
    for (const mode of modes) results.push(await visitLandingPage(browser, appServer.origin, mode))
    return results
  } finally {
    await browser.close()
    appServer.stop()
  }
}

async function startAppServer(fixture) {
  const port = await findFreePort()
  const origin = `http://127.0.0.1:${port}`
  const serverProcess = spawn(process.execPath, [join(fixture, '.output/server/index.mjs')], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
    stdio: 'ignore',
  })
  const stop = () => serverProcess.kill()
  for (let attempt = 0; attempt < 100; attempt++) {
    if (
      await fetch(origin).then(
        ({ ok }) => ok,
        () => false,
      )
    )
      return { origin, stop }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  stop()
  throw new Error('The built Nuxt server did not start')
}

async function findFreePort() {
  const probe = createServer()
  await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve))
  const { port } = probe.address()
  await new Promise((resolve) => probe.close(resolve))
  return port
}

async function visitLandingPage(browser, origin, mode) {
  const context = await browser.newContext()
  try {
    const page = await context.newPage()
    page.setDefaultTimeout(15_000)
    const errors = collectPageErrors(page)
    await page.goto(`${origin}/landing/${mode}?utm_source=${mode}`)
    const readOnMount = await page.getByTestId('on-mount').filter({ hasText: '[' }).textContent()
    await page.waitForLoadState('networkidle')
    const stored = await page.evaluate(() => localStorage.getItem('nuxt-utm-data'))
    return {
      mode,
      storedLandingPages: JSON.parse(stored ?? '[]').map(({ additionalInfo }) =>
        relativeUrl(additionalInfo.landingPageUrl),
      ),
      landingPagesOnMount: JSON.parse(readOnMount).map(relativeUrl),
      errors,
    }
  } finally {
    await context.close()
  }
}

function relativeUrl(url) {
  const { pathname, search } = new URL(url)
  return pathname + search
}

function collectPageErrors(page) {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) errors.push(message.text())
  })
  return errors
}
