import dagre from 'dagre'
import { Position } from '@vue-flow/core'
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

// 클러스터 사이 간격 — LR 그래프는 세로로 쌓이고, TB 그래프는 가로로 쌓인다.
const CLUSTER_GAP_Y = 140
const CLUSTER_GAP_X = 220

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
            return {
                rankdir: 'TB',
                nodesep: 72,
                ranksep: 192,
                edgesep: 38,
                marginx: 40,
                marginy: 40
            }
        case 'user-journey':
            return {
                rankdir: 'LR',
                nodesep: 72,
                ranksep: 240,
                edgesep: 38,
                marginx: 30,
                marginy: 30
            }
        case 'composables':
            return {
                rankdir: 'LR',
                nodesep: 64,
                ranksep: 264,
                edgesep: 38,
                marginx: 36,
                marginy: 36
            }
        case 'fsd':
        default:
            return {
                rankdir: 'LR',
                nodesep: 72,
                ranksep: 264,
                edgesep: 38,
                marginx: 36,
                marginy: 36
            }
    }
}

interface EdgeAttrs {
    weight: number
    minlen: number
}

function getEdgeAttrs(diagramKind: string | undefined, edgeKind: string | undefined): EdgeAttrs {
    if (diagramKind === 'classes') {
        if (edgeKind === 'extends') return { weight: 3, minlen: 2 }
        return { weight: 1, minlen: 1 }
    }
    if (diagramKind === 'fsd') {
        return { weight: 2, minlen: 1 }
    }
    return { weight: 1, minlen: 1 }
}

function calcNodeWidth(label: string, minWidth = 140): number {
    return Math.max(minWidth, Math.ceil(label.length * CHAR_WIDTH_PX) + NODE_PADDING_X)
}

interface Cluster {
    name: string
    nodes: DiagramNode[]
    edges: DiagramEdge[]
}

/**
 * 다이어그램별 클러스터 진입점 식별.
 * fsd: widgets layer 노드 각각이 한 클러스터의 root.
 * composables: facade kind 노드 각각이 한 클러스터의 root.
 * 그 외: 진입점이 없으면 단일 레이아웃 fallback.
 */
function getEntryPoints(diagramKind: string | undefined, nodes: DiagramNode[]): DiagramNode[] {
    switch (diagramKind) {
        case 'fsd':
            return nodes.filter((n) => n.group === 'widgets')
        case 'composables':
            return nodes.filter((n) => n.kind === 'facade')
        default:
            return []
    }
}

/**
 * 진입점에서 reachable 한 노드를 BFS 로 모아 클러스터를 만든다.
 * 같은 노드가 여러 진입점에서 reachable 하면 클러스터마다 복제된다 (의도된 중복).
 * 노드 id 는 `${originalId}__${entryId}` 로 prefix 해서 dagre 충돌을 회피하고,
 * data.originalId 로 원본 id 를 보존해 검색·하이라이트에서 그대로 매칭한다.
 */
function buildClustersByEntry(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    entryPoints: DiagramNode[]
): Cluster[] {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const adjacency = new Map<string, string[]>()
    for (const e of edges) {
        if (!adjacency.has(e.source)) adjacency.set(e.source, [])
        adjacency.get(e.source)!.push(e.target)
    }

    const clusters: Cluster[] = []
    for (const entry of entryPoints) {
        const visited = new Set<string>()
        const queue: string[] = [entry.id]
        while (queue.length > 0) {
            const cur = queue.shift()!
            if (visited.has(cur)) continue
            visited.add(cur)
            for (const next of adjacency.get(cur) ?? []) queue.push(next)
        }

        const idMap = new Map<string, string>()
        const clusterNodes: DiagramNode[] = []
        for (const id of visited) {
            const original = nodeMap.get(id)
            if (!original) continue
            const newId = `${original.id}__${entry.id}`
            idMap.set(original.id, newId)
            clusterNodes.push({
                ...original,
                id: newId,
                data: {
                    ...(original.data ?? {}),
                    __originalId: original.id,
                    __clusterKey: entry.id
                }
            })
        }
        const clusterEdges: DiagramEdge[] = edges
            .filter((e) => visited.has(e.source) && visited.has(e.target))
            .map((e) => ({
                ...e,
                id: `${e.id}__${entry.id}`,
                source: idMap.get(e.source)!,
                target: idMap.get(e.target)!
            }))
        clusters.push({ name: entry.id, nodes: clusterNodes, edges: clusterEdges })
    }
    return clusters
}

interface LaidOutCluster {
    layoutNodes: VueFlowNode[]
    layoutEdges: VueFlowEdge[]
    bbox: { width: number; height: number }
}

/**
 * 한 클러스터를 dagre 로 레이아웃하고, 좌상단을 (0,0) 으로 정규화한 뒤 bounding box 와 함께 반환한다.
 */
function layoutCluster(
    cluster: Cluster,
    graphConfig: GraphConfig,
    diagramKind: string | undefined,
    nodeWidthOverride: number | undefined,
    nodeHeight: number
): LaidOutCluster {
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({
        rankdir: graphConfig.rankdir,
        nodesep: graphConfig.nodesep,
        ranksep: graphConfig.ranksep,
        edgesep: graphConfig.edgesep,
        marginx: graphConfig.marginx,
        marginy: graphConfig.marginy
    })

    for (const n of cluster.nodes) {
        const w = nodeWidthOverride ?? calcNodeWidth(n.label ?? n.id)
        g.setNode(n.id, { width: w, height: nodeHeight })
    }
    for (const e of cluster.edges) {
        const attrs = getEdgeAttrs(diagramKind, e.kind)
        g.setEdge(e.source, e.target, attrs)
    }
    dagre.layout(g)

    const sourcePosition = graphConfig.rankdir === 'TB' ? Position.Bottom : Position.Right
    const targetPosition = graphConfig.rankdir === 'TB' ? Position.Top : Position.Left

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    const rawPositions = cluster.nodes.map((n) => {
        const pos = g.node(n.id)
        const w = nodeWidthOverride ?? calcNodeWidth(n.label ?? n.id)
        const x = pos.x - w / 2
        const y = pos.y - nodeHeight / 2
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x + w > maxX) maxX = x + w
        if (y + nodeHeight > maxY) maxY = y + nodeHeight
        return { node: n, x, y, w }
    })

    if (!isFinite(minX)) {
        minX = 0
        minY = 0
        maxX = 0
        maxY = 0
    }

    const layoutNodes: VueFlowNode[] = rawPositions.map(({ node, x, y }) => ({
        id: node.id,
        type: resolveNodeType(node.kind),
        position: { x: x - minX, y: y - minY },
        data: {
            label: node.label,
            group: node.group,
            kind: node.kind,
            meta: node.data,
            rankdir: graphConfig.rankdir,
            originalId: (node.data as Record<string, unknown> | undefined)?.__originalId ?? node.id,
            clusterKey: (node.data as Record<string, unknown> | undefined)?.__clusterKey
        }
    }))
    const layoutEdges: VueFlowEdge[] = cluster.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'dependency',
        sourcePosition,
        targetPosition,
        data: { kind: e.kind }
    }))

    return {
        layoutNodes,
        layoutEdges,
        bbox: { width: maxX - minX, height: maxY - minY }
    }
}

/**
 * 클러스터 없이 단일 dagre 레이아웃 적용 (classes, user-journey 등).
 */
function layoutSingle(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    options: LayoutOptions,
    graphConfig: GraphConfig,
    nodeHeight: number
): { nodes: VueFlowNode[]; edges: VueFlowEdge[] } {
    const rankdir = options.rankdir ?? graphConfig.rankdir
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

    for (const n of nodes) {
        const w = options.nodeWidth ?? calcNodeWidth(n.label ?? n.id)
        g.setNode(n.id, { width: w, height: nodeHeight })
    }
    for (const e of edges) {
        const attrs = getEdgeAttrs(options.diagramKind, e.kind)
        g.setEdge(e.source, e.target, attrs)
    }
    dagre.layout(g)

    const sourcePosition = rankdir === 'TB' ? Position.Bottom : Position.Right
    const targetPosition = rankdir === 'TB' ? Position.Top : Position.Left

    const layoutNodes: VueFlowNode[] = nodes.map((n) => {
        const pos = g.node(n.id)
        const w = options.nodeWidth ?? calcNodeWidth(n.label ?? n.id)
        return {
            id: n.id,
            type: resolveNodeType(n.kind),
            position: { x: pos.x - w / 2, y: pos.y - nodeHeight / 2 },
            data: {
                label: n.label,
                group: n.group,
                kind: n.kind,
                meta: n.data,
                rankdir,
                originalId: n.id
            }
        }
    })
    const layoutEdges: VueFlowEdge[] = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'dependency',
        sourcePosition,
        targetPosition,
        data: { kind: e.kind }
    }))
    return { nodes: layoutNodes, edges: layoutEdges }
}

export function applyLayout(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    options: LayoutOptions = {}
): { nodes: VueFlowNode[]; edges: VueFlowEdge[] } {
    const diagramKind = options.diagramKind
    const graphConfig = getGraphConfig(diagramKind)
    const nodeHeight = options.nodeHeight ?? NODE_HEIGHT
    const entryPoints = getEntryPoints(diagramKind, nodes)

    if (entryPoints.length === 0) {
        return layoutSingle(nodes, edges, options, graphConfig, nodeHeight)
    }

    const clusters = buildClustersByEntry(nodes, edges, entryPoints)
    const allNodes: VueFlowNode[] = []
    const allEdges: VueFlowEdge[] = []
    let xOffset = 0
    let yOffset = 0

    for (const cluster of clusters) {
        const laidOut = layoutCluster(
            cluster,
            graphConfig,
            diagramKind,
            options.nodeWidth,
            nodeHeight
        )
        for (const n of laidOut.layoutNodes) {
            n.position.x += xOffset
            n.position.y += yOffset
        }
        allNodes.push(...laidOut.layoutNodes)
        allEdges.push(...laidOut.layoutEdges)

        if (graphConfig.rankdir === 'LR') {
            yOffset += laidOut.bbox.height + CLUSTER_GAP_Y
        } else {
            xOffset += laidOut.bbox.width + CLUSTER_GAP_X
        }
    }
    return { nodes: allNodes, edges: allEdges }
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
