import { loadUserJourneyManifest } from '../lib/manifest'
import type { DiagramJSON, DiagramNode, DiagramEdge } from '../../runtime/types'

export async function analyzeUserJourney(manifestPath: string): Promise<DiagramJSON> {
    const nodes: DiagramNode[] = []
    const edges: DiagramEdge[] = []

    try {
        const manifest = loadUserJourneyManifest(manifestPath)
        for (const step of manifest.steps) {
            nodes.push({ id: step.id, label: step.label, kind: 'step' })
            for (const next of step.next ?? []) {
                edges.push({
                    id: `${step.id}->${next}`,
                    source: step.id,
                    target: next,
                    kind: 'navigates'
                })
            }
        }
    } catch {
        console.warn(
            `[user-journey] manifest not found at ${manifestPath} — returning empty diagram`
        )
    }

    return {
        kind: 'user-journey',
        nodes,
        edges,
        meta: {
            generatedAt: new Date().toISOString(),
            sourceCommit: '',
            nodeCount: nodes.length,
            edgeCount: edges.length
        }
    }
}
