import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { analyzeFsd } from '../analyzers/fsd-graph'

const FIXTURE_ROOT = resolve(__dirname, '__fixtures__')

describe('analyzeFsd', () => {
    it('widgets/foo, features/bar, entities/baz 노드를 포함한다', async () => {
        const diagram = await analyzeFsd(FIXTURE_ROOT)
        const ids = diagram.nodes.map((n) => n.id)

        expect(ids).toContain('widgets/foo')
        expect(ids).toContain('features/bar')
        expect(ids).toContain('entities/baz')
    })

    it('widgets/alpha 노드도 포함한다', async () => {
        const diagram = await analyzeFsd(FIXTURE_ROOT)
        const ids = diagram.nodes.map((n) => n.id)

        expect(ids).toContain('widgets/alpha')
    })

    it('각 노드의 group이 해당 레이어명과 일치한다', async () => {
        const diagram = await analyzeFsd(FIXTURE_ROOT)
        const fooNode = diagram.nodes.find((n) => n.id === 'widgets/foo')
        const barNode = diagram.nodes.find((n) => n.id === 'features/bar')
        const bazNode = diagram.nodes.find((n) => n.id === 'entities/baz')

        expect(fooNode?.group).toBe('widgets')
        expect(barNode?.group).toBe('features')
        expect(bazNode?.group).toBe('entities')
    })

    it('widgets/foo -> features/bar import 엣지가 존재한다', async () => {
        const diagram = await analyzeFsd(FIXTURE_ROOT)
        const edge = diagram.edges.find(
            (e) => e.source === 'widgets/foo' && e.target === 'features/bar'
        )

        expect(edge).toBeDefined()
        expect(edge?.kind).toBe('imports')
    })

    it('features/bar -> entities/baz import 엣지가 존재한다', async () => {
        const diagram = await analyzeFsd(FIXTURE_ROOT)
        const edge = diagram.edges.find(
            (e) => e.source === 'features/bar' && e.target === 'entities/baz'
        )

        expect(edge).toBeDefined()
        expect(edge?.kind).toBe('imports')
    })

    it('동일 레이어(widgets) 내부 import 엣지는 생성되지 않는다', async () => {
        // widgets/foo/index.ts가 ~/widgets/alpha/index를 import하지만
        // 같은 레이어이므로 엣지가 제외되어야 한다
        const diagram = await analyzeFsd(FIXTURE_ROOT)
        const sameLayerEdge = diagram.edges.find(
            (e) => e.source === 'widgets/foo' && e.target === 'widgets/alpha'
        )

        expect(sameLayerEdge).toBeUndefined()
    })

    it('반환 kind가 "fsd"이다', async () => {
        const diagram = await analyzeFsd(FIXTURE_ROOT)
        expect(diagram.kind).toBe('fsd')
    })

    it('meta.nodeCount와 실제 nodes 배열 길이가 일치한다', async () => {
        const diagram = await analyzeFsd(FIXTURE_ROOT)
        expect(diagram.meta.nodeCount).toBe(diagram.nodes.length)
        expect(diagram.meta.edgeCount).toBe(diagram.edges.length)
    })
})
