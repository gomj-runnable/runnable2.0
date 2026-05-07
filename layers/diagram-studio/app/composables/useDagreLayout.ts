import dagre from 'dagre'
import type { Node as VueFlowNode, Edge as VueFlowEdge } from '@vue-flow/core'
import type { DiagramNode, DiagramEdge } from '../../runtime/types'

interface LayoutOptions {
    rankdir?: 'LR' | 'TB'
    nodeWidth?: number
    nodeHeight?: number
}

export function applyLayout(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    options: LayoutOptions = {}
): { nodes: VueFlowNode[]; edges: VueFlowEdge[] } {
    const { rankdir = 'LR', nodeWidth = 160, nodeHeight = 48 } = options

    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir, marginx: 20, marginy: 20 })

    for (const n of nodes) {
        g.setNode(n.id, { width: nodeWidth, height: nodeHeight })
    }
    for (const e of edges) {
        g.setEdge(e.source, e.target)
    }

    dagre.layout(g)

    const layoutNodes: VueFlowNode[] = nodes.map((n) => {
        const pos = g.node(n.id)
        return {
            id: n.id,
            type: resolveNodeType(n.kind),
            position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
            data: { label: n.label, group: n.group, kind: n.kind, meta: n.data }
        }
    })

    const layoutEdges: VueFlowEdge[] = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'dependency',
        data: { kind: e.kind }
    }))

    return { nodes: layoutNodes, edges: layoutEdges }
}

function resolveNodeType(kind: string | undefined): string {
    if (!kind) return 'module'
    if (['facade', 'store', 'sideeffect', 'action'].includes(kind)) return 'callable'
    if (['types', 'schemas', 'services'].includes(kind)) return 'class'
    if (kind === 'journey') return 'journey'
    return 'module'
}

export function useDagreLayout() {
    return { applyLayout }
}
