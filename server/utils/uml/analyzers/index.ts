import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'
import pLimit from 'p-limit'
import type { AnalyzeRequestParsed } from '~~/shared/schemas/uml.schema'
import type { AnalyzeResponseItem, Feature } from '~~/shared/types/uml'
import { diagramCachePath } from '../paths'
import { buildFrontendDiagram } from './frontend'
import { buildBackendDiagram } from './backend'
import { buildArchitectureDiagram } from './architecture'

async function buildOne(
    feature: Feature,
    type: AnalyzeRequestParsed['diagramType']
): Promise<AnalyzeResponseItem> {
    try {
        let mermaid: string
        if (feature.domain === 'frontend') mermaid = await buildFrontendDiagram(feature, type)
        else if (feature.domain === 'backend') mermaid = await buildBackendDiagram(feature, type)
        else mermaid = await buildArchitectureDiagram(feature, type)

        const cachePath = diagramCachePath(feature.domain, feature.id)
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
