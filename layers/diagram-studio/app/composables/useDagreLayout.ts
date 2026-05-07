import dagre from 'dagre'
import type { Node as VueFlowNode, Edge as VueFlowEdge } from '@vue-flow/core'
import type { DiagramNode, DiagramEdge } from '../../runtime/types'

interface LayoutOptions {
    rankdir?: 'LR' | 'TB'
    nodeWidth?: number
    nodeHeight?: number
    diagramKind?: string
}

const CHAR_WIDTH_PX = 7.5
const NODE_PADDING_X = 32
const NODE_HEIGHT = 52

interface GraphConfig {
    rankdir: 'LR' | 'TB'
    nodesep: number
    ranksep: number
    edgesep: number
    marginx: number
    marginy: number
}

function getGraphConfig(diagramKind: string | undefined): GraphConfig {
    switch (diagramKind) {
        case 'classes':
            // TB: extends edges want vertical rank separation; uses edges connect laterally
            return {
                rankdir: 'TB',
                nodesep: 60,
                ranksep: 120,
                edgesep: 20,
                marginx: 40,
                marginy: 40
            }
        case 'user-journey':
            // Single linear chain — LR, generous node separation for readability
            return {
                rankdir: 'LR',
                nodesep: 60,
                ranksep: 140,
                edgesep: 20,
                marginx: 30,
                marginy: 30
            }
        case 'composables':
            // facade→store/sideeffect calls — LR, wide ranksep so call arrows are clear
            return {
                rankdir: 'LR',
                nodesep: 50,
                ranksep: 160,
                edgesep: 20,
                marginx: 36,
                marginy: 36
            }
        case 'fsd':
        default:
            // Layer-based LR: widgets→features→entities→shared left-to-right
            return {
                rankdir: 'LR',
                nodesep: 56,
                ranksep: 160,
                edgesep: 20,
                marginx: 36,
                marginy: 36
            }
    }
}

// Edge weight/minlen tuning per diagram kind
interface EdgeAttrs {
    weight: number
    minlen: number
}

function getEdgeAttrs(diagramKind: string | undefined, edgeKind: string | undefined): EdgeAttrs {
    if (diagramKind === 'classes') {
        if (edgeKind === 'extends') return { weight: 3, minlen: 2 }
        // uses: lightweight, allow shorter paths
        return { weight: 1, minlen: 1 }
    }
    if (diagramKind === 'fsd') {
        // imports: enforce strict cross-layer ranking
        return { weight: 2, minlen: 1 }
    }
    // composables calls, user-journey navigates — default
    return { weight: 1, minlen: 1 }
}

function calcNodeWidth(label: string, minWidth = 140): number {
    return Math.max(minWidth, Math.ceil(label.length * CHAR_WIDTH_PX) + NODE_PADDING_X)
}

export function applyLayout(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    options: LayoutOptions = {}
): { nodes: VueFlowNode[]; edges: VueFlowEdge[] } {
    const diagramKind = options.diagramKind
    const graphConfig = getGraphConfig(diagramKind)
    const rankdir = options.rankdir ?? graphConfig.rankdir
    const nodeHeight = options.nodeHeight ?? NODE_HEIGHT

    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({
        rankdir,
        nodesep: graphConfig.nodesep,
        ranksep: graphConfig.ranksep,
        edgesep: graphConfig.edgesep,
        marginx: graphConfig.marginx,
        marginy: graphConfig.marginy
    })

    // fsd: same-layer nodes get rank=same so they sit horizontally in the same column
    if (diagramKind === 'fsd') {
        const layerGroups: Record<string, string[]> = {}
        for (const n of nodes) {
            const layer = n.group ?? 'shared'
            if (!layerGroups[layer]) layerGroups[layer] = []
            layerGroups[layer].push(n.id)
        }
        // Create subgraph clusters by setting rank constraint via a virtual "rank" node approach
        // dagre supports rank=same via subgraphs when using graphlib compound graphs
        for (const [layer, members] of Object.entries(layerGroups)) {
            if (members.length > 1) {
                g.setNode(`__rank_${layer}`, { width: 0, height: 0, rank: 'same' })
                for (const id of members) {
                    // Connect all members to the rank node with weight=0 so they co-rank
                    g.setEdge(`__rank_${layer}`, id, { weight: 0, minlen: 0 })
                }
            }
        }
    }

    for (const n of nodes) {
        const w = options.nodeWidth ?? calcNodeWidth(n.label ?? n.id)
        g.setNode(n.id, { width: w, height: nodeHeight })
    }

    for (const e of edges) {
        const attrs = getEdgeAttrs(diagramKind, e.kind)
        g.setEdge(e.source, e.target, attrs)
    }

    dagre.layout(g)

    const layoutNodes: VueFlowNode[] = nodes.map((n) => {
        const pos = g.node(n.id)
        const w = options.nodeWidth ?? calcNodeWidth(n.label ?? n.id)
        return {
            id: n.id,
            type: resolveNodeType(n.kind),
            position: { x: pos.x - w / 2, y: pos.y - nodeHeight / 2 },
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
