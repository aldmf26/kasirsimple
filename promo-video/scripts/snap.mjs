// QC: potret frame kunci jadi PNG (bundle sekali). Pemakaian: node scripts/snap.mjs 0 45 100 ...
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// optional first arg --id=CompositionId (default KasirOKPromo)
const idArg = process.argv.find(a => a.startsWith('--id='))
const compId = idArg ? idArg.slice(5) : 'KasirOKPromo'
const frames = process.argv.slice(2).filter(a => !a.startsWith('--')).map(Number)
const outDir = join(root, 'out', 'stills')
mkdirSync(outDir, { recursive: true })

const serveUrl = await bundle({ entryPoint: join(root, 'src', 'index.ts'), publicDir: join(root, 'public') })
const composition = await selectComposition({ serveUrl, id: compId })
for (const frame of frames) {
  const output = join(outDir, `${compId}-f${String(frame).padStart(3, '0')}.png`)
  await renderStill({ serveUrl, composition, frame, output, scale: 0.5 })
  console.log(output)
}
