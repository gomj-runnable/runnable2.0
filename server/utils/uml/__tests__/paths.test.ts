import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { repoRoot, umlCacheDir, featuresCachePath, diagramCachePath } from '../paths'

describe('repoRoot', () => {
    it('process.cwd() 를 가리킨다 (dev/prod 모두 동작)', () => {
        expect(repoRoot).toBe(process.cwd())
    })
})

describe('umlCacheDir', () => {
    it('.cache/uml 경로', () => {
        expect(umlCacheDir).toBe(resolve(process.cwd(), '.cache/uml'))
    })
})

describe('featuresCachePath', () => {
    it('.cache/uml/features.json 경로', () => {
        expect(featuresCachePath).toBe(resolve(process.cwd(), '.cache/uml/features.json'))
    })
})

describe('diagramCachePath()', () => {
    it('domain/featureId/diagramType 기반 .mmd 경로 반환', () => {
        const result = diagramCachePath('frontend', 'frontend:pages:auth', 'flowchart')
        expect(result).toBe(
            resolve(process.cwd(), '.cache/uml/frontend/frontend_pages_auth.flowchart.mmd')
        )
    })

    it('diagramType 이 파일명에 반영되어 동일 feature 라도 type 별로 분리된다', () => {
        const flow = diagramCachePath('frontend', 'frontend:pages:auth', 'flowchart')
        const cls = diagramCachePath('frontend', 'frontend:pages:auth', 'class')
        expect(flow).not.toBe(cls)
        expect(flow).toContain('.flowchart.mmd')
        expect(cls).toContain('.class.mmd')
    })

    it('특수문자를 _ 로 치환', () => {
        const result = diagramCachePath('backend', 'some/weird:id@here', 'sequence')
        expect(result).toContain('some_weird_id_here.sequence.mmd')
    })
})
