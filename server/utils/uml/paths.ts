import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// server/utils/uml/paths.ts → repo root
export const repoRoot = resolve(__dirname, '../../../')

export const umlCacheDir = resolve(repoRoot, '.omc/uml-cache')
export const featuresCachePath = resolve(umlCacheDir, 'features.json')

export function diagramCachePath(domain: string, featureId: string): string {
    const safe = featureId.replace(/[^a-z0-9_-]/gi, '_')
    return resolve(umlCacheDir, domain, `${safe}.mmd`)
}
