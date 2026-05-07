import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { analyzeComposables } from '../analyzers/composable-graph'

const FIXTURE_ROOT = resolve(__dirname, '__fixtures__/analyzers')

describe('analyzeComposables — analyzer regression suite', () => {
    describe('basic-import.ts', () => {
        it('useBasic 노드를 추출한다', async () => {
            const diagram = await analyzeComposables(FIXTURE_ROOT)
            const node = diagram.nodes.find((n) => n.id === 'useBasic')
            expect(node).toBeDefined()
        })

        it('useFoo 노드를 추출한다', async () => {
            const diagram = await analyzeComposables(FIXTURE_ROOT)
            const node = diagram.nodes.find((n) => n.id === 'useFoo')
            expect(node).toBeDefined()
        })

        it('useBasic -> useFoo calls 엣지를 생성한다', async () => {
            const diagram = await analyzeComposables(FIXTURE_ROOT)
            const edge = diagram.edges.find((e) => e.source === 'useBasic' && e.target === 'useFoo')
            expect(edge).toBeDefined()
            expect(edge?.kind).toBe('calls')
        })
    })

    describe('re-export.ts', () => {
        it('export { useFoo } from ... 형태는 노드를 생성하지 않는다 (재export 미지원 알려진 한계)', async () => {
            const diagram = await analyzeComposables(FIXTURE_ROOT)
            // re-export 자체가 새 정의로 잡히지 않는 것을 검증
            const reexportNodes = diagram.nodes.filter((n) =>
                (n.data?.file as string)?.includes('re-export.ts')
            )
            expect(reexportNodes).toHaveLength(0)
        })
    })

    describe('dynamic-import.ts', () => {
        it('useDynamic 노드를 추출한다', async () => {
            const diagram = await analyzeComposables(FIXTURE_ROOT)
            const node = diagram.nodes.find((n) => n.id === 'useDynamic')
            expect(node).toBeDefined()
        })

        it('동적 import 결과의 useFoo() 호출도 calls 엣지로 잡는다', async () => {
            const diagram = await analyzeComposables(FIXTURE_ROOT)
            const edge = diagram.edges.find(
                (e) => e.source === 'useDynamic' && e.target === 'useFoo'
            )
            expect(edge).toBeDefined()
            expect(edge?.kind).toBe('calls')
        })
    })

    describe('alias-call.ts', () => {
        it('useAliasCaller 노드를 추출한다', async () => {
            const diagram = await analyzeComposables(FIXTURE_ROOT)
            const node = diagram.nodes.find((n) => n.id === 'useAliasCaller')
            expect(node).toBeDefined()
        })

        it('alias 로 import 한 useAliased 호출은 원본(useFoo) 엣지로 연결되지 않는다 (알려진 한계)', async () => {
            const diagram = await analyzeComposables(FIXTURE_ROOT)
            // 분석기는 alias 를 추적하지 못하므로 useAliasCaller -> useFoo 엣지가 없어야 한다
            const edge = diagram.edges.find(
                (e) => e.source === 'useAliasCaller' && e.target === 'useFoo'
            )
            expect(edge).toBeUndefined()
        })

        it('useAliased 라는 노드 자체가 정의되지 않았으므로 useAliasCaller -> useAliased 엣지도 없다', async () => {
            const diagram = await analyzeComposables(FIXTURE_ROOT)
            const aliasedNode = diagram.nodes.find((n) => n.id === 'useAliased')
            expect(aliasedNode).toBeUndefined()

            const edge = diagram.edges.find(
                (e) => e.source === 'useAliasCaller' && e.target === 'useAliased'
            )
            expect(edge).toBeUndefined()
        })
    })

    describe('empty.ts', () => {
        it('빈 파일은 노드를 생성하지 않는다', async () => {
            const diagram = await analyzeComposables(FIXTURE_ROOT)
            const emptyNodes = diagram.nodes.filter((n) =>
                (n.data?.file as string)?.includes('empty.ts')
            )
            expect(emptyNodes).toHaveLength(0)
        })
    })

    describe('전체 다이어그램 메타', () => {
        it('kind 가 "composables" 이다', async () => {
            const diagram = await analyzeComposables(FIXTURE_ROOT)
            expect(diagram.kind).toBe('composables')
        })

        it('meta.nodeCount/edgeCount 와 실제 배열 길이가 일치한다', async () => {
            const diagram = await analyzeComposables(FIXTURE_ROOT)
            expect(diagram.meta.nodeCount).toBe(diagram.nodes.length)
            expect(diagram.meta.edgeCount).toBe(diagram.edges.length)
        })
    })
})
