// prod 컨테이너에는 .output / lib 만 복사되어 app/, server/ 원본 트리가 없다.
// 호스트 빌드 시점에:
//  1) features.json (사이드바용 메타데이터)
//  2) 각 feature × diagramType 조합의 .mmd (분석 실행 결과)
// 를 미리 만들어 .cache/uml/ 아래에 두면, prod 에선 두 단계 모두 캐시 hit.
import { promises as fs } from 'node:fs'
import { dirname, relative } from 'node:path'
import type { DiagramType, DomainTab, Feature } from '../shared/types/uml'
import { detectAllFeatures } from '../server/utils/uml/detect-features'
import { buildFrontendDiagram } from '../server/utils/uml/analyzers/frontend'
import { buildBackendDiagram } from '../server/utils/uml/analyzers/backend'
import { buildArchitectureDiagram } from '../server/utils/uml/analyzers/architecture'
import { diagramCachePath, featuresCachePath, repoRoot } from '../server/utils/uml/paths'

// app/pages/admin/uml.vue 의 diagramTypeOptions 와 동일하게 맞춘다.
const DOMAIN_DIAGRAM_TYPES: Record<DomainTab, DiagramType[]> = {
    planning: [], // buildOne 이 별도 TODO 메시지 반환 — prebuild 불필요
    frontend: ['flowchart', 'class'],
    backend: ['class', 'sequence'],
    library: ['flowchart', 'dependency']
}

function pickAnalyzer(feature: Feature) {
    if (feature.id.startsWith('library:') || feature.id.startsWith('backend:infra:')) {
        return buildArchitectureDiagram
    }
    if (feature.domain === 'frontend') return buildFrontendDiagram
    if (feature.domain === 'backend') return buildBackendDiagram
    return buildArchitectureDiagram
}

const payload = await detectAllFeatures()

if (payload.features.length === 0) {
    console.error('[build-uml-cache] detect 결과가 0건입니다. 캐시를 작성하지 않습니다.')
    process.exit(1)
}

await fs.mkdir(dirname(featuresCachePath), { recursive: true })
await fs.writeFile(featuresCachePath, JSON.stringify(payload, null, 2), 'utf-8')
console.log(
    `[build-uml-cache] ${payload.features.length} features → ${relative(repoRoot, featuresCachePath)}`
)

let diagramCount = 0
let failCount = 0
for (const feature of payload.features) {
    const types = DOMAIN_DIAGRAM_TYPES[feature.domain]
    if (!types?.length) continue
    const analyzer = pickAnalyzer(feature)
    for (const type of types) {
        const path = diagramCachePath(feature.domain, feature.id, type)
        try {
            const mermaid = await analyzer(feature, type)
            await fs.mkdir(dirname(path), { recursive: true })
            await fs.writeFile(path, mermaid, 'utf-8')
            diagramCount++
        } catch (err) {
            failCount++
            const msg = err instanceof Error ? err.message : String(err)
            console.error(`[build-uml-cache] analyze failed: ${feature.id} (${type}) — ${msg}`)
        }
    }
}

console.log(`[build-uml-cache] ${diagramCount} diagrams written (${failCount} failed)`)
if (failCount > 0) process.exit(1)
