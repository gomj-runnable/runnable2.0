import { describe, it, expect, vi, beforeEach } from 'vitest'

import { analyzeFeatures } from '../index'
import type { Feature } from '~~/shared/types/uml'

const fsWriteFile = vi.hoisted(() => vi.fn())
const fsMkdir = vi.hoisted(() => vi.fn())
const fsReadFile = vi.hoisted(() => vi.fn())

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>()
    return {
        ...actual,
        promises: {
            ...actual.promises,
            writeFile: fsWriteFile,
            mkdir: fsMkdir,
            readFile: fsReadFile
        }
    }
})

const buildFrontendDiagram = vi.hoisted(() => vi.fn())
const buildBackendDiagram = vi.hoisted(() => vi.fn())
const buildArchitectureDiagram = vi.hoisted(() => vi.fn())

vi.mock('../frontend', () => ({ buildFrontendDiagram }))
vi.mock('../backend', () => ({ buildBackendDiagram }))
vi.mock('../architecture', () => ({ buildArchitectureDiagram }))

const f = (overrides: Partial<Feature> = {}): Feature => ({
    id: 'frontend:auth',
    domain: 'frontend' as any,
    name: 'A',
    paths: ['app/x'],
    fileCount: 0,
    detectedAt: '2026-05-15T00:00:00Z',
    ...overrides
})

describe('analyzeFeatures()', () => {
    beforeEach(() => {
        fsWriteFile.mockReset()
        fsMkdir.mockReset()
        fsReadFile.mockReset()
        buildFrontendDiagram.mockReset()
        buildBackendDiagram.mockReset()
        buildArchitectureDiagram.mockReset()
    })

    it('planning domain — fixed mermaid placeholder', async () => {
        const result = await analyzeFeatures(
            [f({ domain: 'planning' as any, id: 'planning:roadmap' })],
            'flowchart'
        )
        expect(result[0]!.mermaid).toContain('기획 다이어그램')
    })

    it('frontend domain → buildFrontendDiagram', async () => {
        buildFrontendDiagram.mockResolvedValue('flowchart TD\n  a')
        const result = await analyzeFeatures([f()], 'flowchart')
        expect(buildFrontendDiagram).toHaveBeenCalledOnce()
        expect(result[0]!.mermaid).toBe('flowchart TD\n  a')
    })

    it('backend domain → buildBackendDiagram', async () => {
        buildBackendDiagram.mockResolvedValue('class')
        const result = await analyzeFeatures(
            [f({ domain: 'backend' as any, id: 'backend:routes' })],
            'class'
        )
        expect(buildBackendDiagram).toHaveBeenCalledOnce()
        expect(result[0]!.mermaid).toBe('class')
    })

    it('id 가 "library:" prefix → buildArchitectureDiagram', async () => {
        buildArchitectureDiagram.mockResolvedValue('arch')
        await analyzeFeatures([f({ id: 'library:vue', domain: 'frontend' as any })], 'dependency')
        expect(buildArchitectureDiagram).toHaveBeenCalledOnce()
    })

    it('id 가 "backend:infra:" prefix → buildArchitectureDiagram', async () => {
        buildArchitectureDiagram.mockResolvedValue('arch')
        await analyzeFeatures(
            [f({ id: 'backend:infra:db', domain: 'backend' as any })],
            'flowchart'
        )
        expect(buildArchitectureDiagram).toHaveBeenCalledOnce()
    })

    it('analyzer 가 throw 하면 error 필드 + fallback mermaid 반환', async () => {
        buildFrontendDiagram.mockRejectedValue(new Error('boom'))
        const result = await analyzeFeatures([f()], 'flowchart')
        expect(result[0]!.error).toBe('boom')
        expect(result[0]!.mermaid).toContain('analyze failed')
    })

    it('성공 시 cache 파일에 writeFile + mkdir 호출', async () => {
        buildFrontendDiagram.mockResolvedValue('ok')
        await analyzeFeatures([f()], 'flowchart')
        expect(fsMkdir).toHaveBeenCalled()
        expect(fsWriteFile).toHaveBeenCalled()
    })

    it('NODE_ENV=production — readFile 로 prebuilt 캐시 사용', async () => {
        const prev = process.env.NODE_ENV
        process.env.NODE_ENV = 'production'
        try {
            fsReadFile.mockResolvedValue('prebuilt-content')
            const result = await analyzeFeatures([f()], 'flowchart')
            expect(result[0]!.mermaid).toBe('prebuilt-content')
            expect(buildFrontendDiagram).not.toHaveBeenCalled()
        } finally {
            process.env.NODE_ENV = prev
        }
    })

    it('NODE_ENV=production + 캐시 miss → error 필드 + miss mermaid', async () => {
        const prev = process.env.NODE_ENV
        process.env.NODE_ENV = 'production'
        try {
            fsReadFile.mockRejectedValue(new Error('ENOENT'))
            const result = await analyzeFeatures([f()], 'flowchart')
            expect(result[0]!.error).toBe('prebuilt cache miss')
            expect(result[0]!.mermaid).toContain('prebuilt 캐시 없음')
        } finally {
            process.env.NODE_ENV = prev
        }
    })

    it('여러 feature 를 p-limit(4) 로 병렬 처리', async () => {
        buildFrontendDiagram.mockResolvedValue('ok')
        const features = Array.from({ length: 10 }, (_, i) => f({ id: `frontend:f${i}` }))
        const results = await analyzeFeatures(features, 'flowchart')
        expect(results).toHaveLength(10)
    })
})
