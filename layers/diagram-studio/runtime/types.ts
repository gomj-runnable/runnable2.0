export type TabKind = 'user-journey' | 'fsd' | 'composables' | 'classes'

export const TAB_KINDS: TabKind[] = ['user-journey', 'fsd', 'composables', 'classes']

export function isTabKind(value: unknown): value is TabKind {
    return typeof value === 'string' && (TAB_KINDS as string[]).includes(value)
}

export interface DiagramJSON {
    kind: TabKind
    nodes: DiagramNode[]
    edges: DiagramEdge[]
    meta: {
        generatedAt: string
        sourceCommit: string
        nodeCount: number
        edgeCount: number
        error?: string
    }
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
