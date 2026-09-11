import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const directory = mkdtempSync(join(tmpdir(), 'nuxt-utm-consumer-'))

try {
  const packed = JSON.parse(execFileSync('npm', [
    'pack', '--ignore-scripts', '--json', '--pack-destination', directory,
  ], { cwd: root, encoding: 'utf8' }))
  const packageDirectory = join(directory, 'node_modules/nuxt-utm')
  mkdirSync(packageDirectory, { recursive: true })
  execFileSync('tar', ['-xzf', join(directory, packed[0].filename), '--strip-components=1', '-C', packageDirectory])
  writeFileSync(join(directory, 'consumer.mts'), readFileSync(join(root, 'test/package-fixture/consumer.mts')))
  writeFileSync(join(directory, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      module: 'NodeNext', moduleResolution: 'NodeNext', target: 'ESNext',
      strict: true, skipLibCheck: true, noEmit: true, types: [],
    },
    files: ['consumer.mts'],
  }))
  execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', directory], { stdio: 'inherit' })
} finally {
  rmSync(directory, { recursive: true, force: true })
}
