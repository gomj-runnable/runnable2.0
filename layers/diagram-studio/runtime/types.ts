export interface DiagramJSON {
    kind: 'fsd' | 'composables' | 'classes' | 'user-journey'
    nodes: DiagramNode[]
    edges: DiagramEdge[]
    meta: { generatedAt: string; sourceCommit: string; nodeCount: number; edgeCount: number }
}

export interface DiagramNode {
    id: string
    label: string
    group?: string
    kind?: string
    data?: Record<string, unknown>
}

export interface DiagramEdge {
    id: string
    source: string
    target: string
    label?: string
    kind?: 'imports' | 'calls' | 'extends' | 'uses' | 'navigates'
}
