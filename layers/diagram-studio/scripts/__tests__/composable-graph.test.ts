import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { analyzeComposables } from '../analyzers/composable-graph'

const FIXTURE_ROOT = resolve(__dirname, '__fixtures__')

describe('analyzeComposables', () => {
    it('useBar 노드가 존재한다', async () => {
        const diagram = await analyzeComposables(FIXTURE_ROOT)
        const node = diagram.nodes.find((n) => n.id === 'useBar')

        expect(node).toBeDefined()
    })

    it('useBaz 노드가 존재한다', async () => {
        const diagram = await analyzeComposables(FIXTURE_ROOT)
        const node = diagram.nodes.find((n) => n.id === 'useBaz')

        expect(node).toBeDefined()
    })

    it('useBar -> useBaz calls 엣지가 존재한다', async () => {
        const diagram = await analyzeComposables(FIXTURE_ROOT)
        const edge = diagram.edges.find((e) => e.source === 'useBar' && e.target === 'useBaz')

        expect(edge).toBeDefined()
        expect(edge?.kind).toBe('calls')
    })

    it('useBar는 /api/ 경로에 있으므로 kind가 "sideeffect"이다', async () => {
        const diagram = await analyzeComposables(FIXTURE_ROOT)
        const node = diagram.nodes.find((n) => n.id === 'useBar')

        expect(node?.kind).toBe('sideeffect')
    })

    it('useBaz는 /model/ 경로에 있으므로 kind가 "store"이다', async () => {
        const diagram = await analyzeComposables(FIXTURE_ROOT)
        const node = diagram.nodes.find((n) => n.id === 'useBaz')

        expect(node?.kind).toBe('store')
    })

    it('반환 kind가 "composables"이다', async () => {
        const diagram = await analyzeComposables(FIXTURE_ROOT)
        expect(diagram.kind).toBe('composables')
    })

    it('meta.nodeCount와 실제 nodes 배열 길이가 일치한다', async () => {
        const diagram = await analyzeComposables(FIXTURE_ROOT)
        expect(diagram.meta.nodeCount).toBe(diagram.nodes.length)
        expect(diagram.meta.edgeCount).toBe(diagram.edges.length)
    })
})
