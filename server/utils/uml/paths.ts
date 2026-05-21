import { resolve } from 'node:path'

// dev(tsx 직실행)와 prod(.output/server) 모두에서 프로젝트 루트는 process.cwd().
// __dirname 은 prod 빌드에서 .output/server/... 안쪽을 가리키므로 사용 금지.
export const repoRoot = process.cwd()

export const umlCacheDir = resolve(repoRoot, '.cache/uml')
export const featuresCachePath = resolve(umlCacheDir, 'features.json')

export function diagramCachePath(domain: string, featureId: string, diagramType: string): string {
    const safe = featureId.replace(/[^a-z0-9_-]/gi, '_')
    return resolve(umlCacheDir, domain, `${safe}.${diagramType}.mmd`)
}
