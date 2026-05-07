import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolve } from 'node:path'
import { analyzeUserJourney } from '../analyzers/user-journey'

const FIXTURE_ROOT = resolve(__dirname, '__fixtures__')
const MANIFEST_PATH = resolve(FIXTURE_ROOT, 'manifests/journey.fixture.yaml')

describe('analyzeUserJourney', () => {
    it('fixture YAML에서 3개의 step 노드를 반환한다', async () => {
        const diagram = await analyzeUserJourney(MANIFEST_PATH)

        expect(diagram.nodes).toHaveLength(3)
    })

    it('start, browse, detail 노드 id가 존재한다', async () => {
        const diagram = await analyzeUserJourney(MANIFEST_PATH)
        const ids = diagram.nodes.map((n) => n.id)

        expect(ids).toContain('start')
        expect(ids).toContain('browse')
        expect(ids).toContain('detail')
    })

    it('각 노드의 kind가 "step"이다', async () => {
        const diagram = await analyzeUserJourney(MANIFEST_PATH)
        for (const node of diagram.nodes) {
            expect(node.kind).toBe('step')
        }
    })

    it('next 관계에 따라 2개의 navigates 엣지를 반환한다', async () => {
        const diagram = await analyzeUserJourney(MANIFEST_PATH)

        // start->browse, browse->detail (detail.next=[] 이므로 엣지 없음)
        expect(diagram.edges).toHaveLength(2)
    })

    it('start -> browse navigates 엣지가 존재한다', async () => {
        const diagram = await analyzeUserJourney(MANIFEST_PATH)
        const edge = diagram.edges.find((e) => e.source === 'start' && e.target === 'browse')

        expect(edge).toBeDefined()
        expect(edge?.kind).toBe('navigates')
    })

    it('browse -> detail navigates 엣지가 존재한다', async () => {
        const diagram = await analyzeUserJourney(MANIFEST_PATH)
        const edge = diagram.edges.find((e) => e.source === 'browse' && e.target === 'detail')

        expect(edge).toBeDefined()
        expect(edge?.kind).toBe('navigates')
    })

    it('반환 kind가 "user-journey"이다', async () => {
        const diagram = await analyzeUserJourney(MANIFEST_PATH)
        expect(diagram.kind).toBe('user-journey')
    })

    describe('존재하지 않는 manifest 경로', () => {
        let warnSpy: ReturnType<typeof vi.spyOn>

        beforeEach(() => {
            warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        })

        afterEach(() => {
            warnSpy.mockRestore()
        })

        it('빈 nodes 배열을 반환한다', async () => {
            const diagram = await analyzeUserJourney('/non-existent/path/journey.yaml')
            expect(diagram.nodes).toHaveLength(0)
        })

        it('빈 edges 배열을 반환한다', async () => {
            const diagram = await analyzeUserJourney('/non-existent/path/journey.yaml')
            expect(diagram.edges).toHaveLength(0)
        })

        it('console.warn을 호출한다', async () => {
            await analyzeUserJourney('/non-existent/path/journey.yaml')
            expect(warnSpy).toHaveBeenCalledOnce()
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('manifest not found'))
        })
    })
})
