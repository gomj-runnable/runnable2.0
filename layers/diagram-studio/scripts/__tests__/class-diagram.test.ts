import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { analyzeClasses } from '../analyzers/class-diagram'

const FIXTURE_ROOT = resolve(__dirname, '__fixtures__')

describe('analyzeClasses', () => {
    it('FooBase 노드가 존재한다', async () => {
        const diagram = await analyzeClasses(FIXTURE_ROOT)
        const node = diagram.nodes.find((n) => n.id === 'FooBase')

        expect(node).toBeDefined()
    })

    it('FooSaved 노드가 존재한다', async () => {
        const diagram = await analyzeClasses(FIXTURE_ROOT)
        const node = diagram.nodes.find((n) => n.id === 'FooSaved')

        expect(node).toBeDefined()
    })

    it('FooBase, FooSaved 노드의 group이 "types"이다', async () => {
        const diagram = await analyzeClasses(FIXTURE_ROOT)
        const fooBase = diagram.nodes.find((n) => n.id === 'FooBase')
        const fooSaved = diagram.nodes.find((n) => n.id === 'FooSaved')

        expect(fooBase?.group).toBe('types')
        expect(fooSaved?.group).toBe('types')
    })

    it('FooSaved extends FooBase 엣지가 존재한다', async () => {
        const diagram = await analyzeClasses(FIXTURE_ROOT)
        const edge = diagram.edges.find(
            (e) => e.source === 'FooSaved' && e.target === 'FooBase' && e.kind === 'extends'
        )

        expect(edge).toBeDefined()
    })

    it('fooSchema 노드가 존재하고 group이 "schemas"이다', async () => {
        const diagram = await analyzeClasses(FIXTURE_ROOT)
        const node = diagram.nodes.find((n) => n.id === 'fooSchema')

        expect(node).toBeDefined()
        expect(node?.group).toBe('schemas')
    })

    it('반환 kind가 "classes"이다', async () => {
        const diagram = await analyzeClasses(FIXTURE_ROOT)
        expect(diagram.kind).toBe('classes')
    })

    it('meta.nodeCount와 실제 nodes 배열 길이가 일치한다', async () => {
        const diagram = await analyzeClasses(FIXTURE_ROOT)
        expect(diagram.meta.nodeCount).toBe(diagram.nodes.length)
        expect(diagram.meta.edgeCount).toBe(diagram.edges.length)
    })
})
