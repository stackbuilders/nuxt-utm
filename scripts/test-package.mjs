import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { testCompatibility } from './test-compatibility.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const directory = mkdtempSync(join(tmpdir(), 'nuxt-utm-consumer-'))

try {
  const packed = JSON.parse(
    execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', directory], {
      cwd: root,
      encoding: 'utf8',
    }),
  )
  const tarball = join(directory, packed[0].filename)
  const packageDirectory = join(directory, 'node_modules/nuxt-utm')
  mkdirSync(packageDirectory, { recursive: true })
  execFileSync('tar', ['-xzf', tarball, '--strip-components=1', '-C', packageDirectory])
  writeFileSync(
    join(directory, 'consumer.mts'),
    readFileSync(join(root, 'test/package-fixture/consumer.mts')),
  )
  writeFileSync(
    join(directory, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        target: 'ESNext',
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        types: [],
      },
      files: ['consumer.mts'],
    }),
  )
  const compiler = typescriptCompiler(process.env.TYPESCRIPT_VERSION)
  execFileSync(process.execPath, [compiler, '-p', directory], { stdio: 'inherit' })
  if (process.argv.includes('--app')) await testCompatibility({ root, directory, tarball })
} finally {
  rmSync(directory, { recursive: true, force: true })
}

// Consumers compile the published declarations with their own TypeScript, so CI checks newer
// releases than the one this repository builds with
function typescriptCompiler(version) {
  if (!version) return join(root, 'node_modules/typescript/bin/tsc')
  const prefix = join(directory, 'typescript')
  const install = [
    'install',
    '--prefix',
    prefix,
    '--no-audit',
    '--no-fund',
    `typescript@${version}`,
  ]
  execFileSync('npm', install, { stdio: 'inherit' })
  const typescript = join(prefix, 'node_modules/typescript')
  const { version: installed } = JSON.parse(readFileSync(join(typescript, 'package.json'), 'utf8'))
  console.log(`Checking package types with TypeScript ${installed}`)
  return join(typescript, 'bin/tsc')
}
