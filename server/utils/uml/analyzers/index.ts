import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'
import pLimit from 'p-limit'
import type { AnalyzeRequestParsed } from '~~/shared/schemas/uml.schema'
import type { AnalyzeResponseItem, Feature } from '~~/shared/types/uml'
import { diagramCachePath } from '../paths'
import { buildFrontendDiagram } from './frontend'
import { buildBackendDiagram } from './backend'
import { buildArchitectureDiagram } from './architecture'

function pickAnalyzer(
    feature: Feature
): (f: Feature, t: AnalyzeRequestParsed['diagramType']) => Promise<string> {
    // #125: 인프라 시각(library + backend:infra) 은 architecture 분석기를 공유
    if (feature.id.startsWith('library:') || feature.id.startsWith('backend:infra:')) {
        return buildArchitectureDiagram
    }
    if (feature.domain === 'frontend') return buildFrontendDiagram
    if (feature.domain === 'backend') return buildBackendDiagram
    return buildArchitectureDiagram
}

async function buildOne(
    feature: Feature,
    type: AnalyzeRequestParsed['diagramType']
): Promise<AnalyzeResponseItem> {
    if (feature.domain === 'planning') {
        return {
            featureId: feature.id,
            mermaid: 'flowchart LR\n  todo["기획 다이어그램 데이터 소스 미정 (#125 후속)"]'
        }
    }
    const cachePath = diagramCachePath(feature.domain, feature.id, type)

    // prod 컨테이너에는 소스 트리가 없어 live analyze 가 (no source files) 로 떨어진다.
    // 빌드 시점에 동봉된 prebuilt .mmd 가 있으면 그걸 그대로 반환.
    if (process.env.NODE_ENV === 'production') {
        try {
            const mermaid = await fs.readFile(cachePath, 'utf-8')
            return { featureId: feature.id, mermaid }
        } catch {
            return {
                featureId: feature.id,
                mermaid: `flowchart LR\n  miss["(prebuilt 캐시 없음: ${feature.id} / ${type})"]`,
                error: 'prebuilt cache miss'
            }
        }
    }

    try {
        const analyzer = pickAnalyzer(feature)
        const mermaid = await analyzer(feature, type)

        await fs.mkdir(dirname(cachePath), { recursive: true })
        await fs.writeFile(cachePath, mermaid, 'utf-8')

        return { featureId: feature.id, mermaid }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
            featureId: feature.id,
            mermaid: `%% analyze failed: ${msg}\nflowchart LR\n  err["analyze failed"]`,
            error: msg
        }
    }
}

export async function analyzeFeatures(
    features: Feature[],
    type: AnalyzeRequestParsed['diagramType']
): Promise<AnalyzeResponseItem[]> {
    const limit = pLimit(4)
    return Promise.all(features.map((f) => limit(() => buildOne(f, type))))
}
