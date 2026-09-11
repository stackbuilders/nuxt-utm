import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join, extname } from 'node:path'
import { chromium } from 'playwright'

export async function testCompatibility({ root, directory, tarball }) {
  const version = process.env.NUXT_VERSION ?? '4'
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
      dependencies: { 'nuxt': version, 'nuxt-utm': `file:${tarball}`, 'vue': '^3.5.0' },
      devDependencies: { 'typescript': '~5.9.3', 'vue-tsc': '^3.3.8' },
    }),
  )
  writeFileSync(
    join(fixture, 'tsconfig.json'),
    JSON.stringify({ extends: './.nuxt/tsconfig.json' }),
  )
  const run = (command, args) =>
    execFileSync(command, args, {
      cwd: fixture,
      stdio: 'inherit',
      timeout: 300_000,
      env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' },
    })
  run('corepack', ['yarn', 'install', '--non-interactive'])
  const installed = JSON.parse(
    readFileSync(join(fixture, 'node_modules/nuxt/package.json'), 'utf8'),
  )
  console.log(`Testing published package with Nuxt ${installed.version}`)
  run('corepack', ['yarn', 'nuxt', 'prepare'])
  run('corepack', ['yarn', 'vue-tsc', '--noEmit'])
  run('corepack', ['yarn', 'nuxt', 'build'])
  run('corepack', ['yarn', 'nuxt', 'generate'])

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
    const html = await (await fetch(`${origin}/contact`)).text()
    assert.match(html, /Contact us/)
    browser = await chromium.launch()
    const page = await browser.newPage()
    page.setDefaultTimeout(15_000)
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (/hydration/i.test(message.text())) errors.push(message.text())
    })
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
    assert.equal(await page.getByTestId('history-count').textContent().then((text) => text.trim()), '3')
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
    console.log(
      `Nuxt ${installed.version}: package types, build, generate, navigation, reload, and form attribution passed`,
    )
  } finally {
    await browser?.close()
    await new Promise((resolve) => server.close(resolve))
  }
}
