import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { repoRoot, umlCacheDir, featuresCachePath, diagramCachePath } from '../paths'

describe('repoRoot', () => {
    it('process.cwd() 를 가리킨다 (dev/prod 모두 동작)', () => {
        expect(repoRoot).toBe(process.cwd())
    })
})

describe('umlCacheDir', () => {
    it('.omc/uml-cache 경로', () => {
        expect(umlCacheDir).toBe(resolve(process.cwd(), '.omc/uml-cache'))
    })
})

describe('featuresCachePath', () => {
    it('.omc/uml-cache/features.json 경로', () => {
        expect(featuresCachePath).toBe(resolve(process.cwd(), '.omc/uml-cache/features.json'))
    })
})

describe('diagramCachePath()', () => {
    it('domain/featureId 기반 .mmd 경로 반환', () => {
        const result = diagramCachePath('frontend', 'frontend:pages:auth')
        expect(result).toBe(
            resolve(process.cwd(), '.omc/uml-cache/frontend/frontend_pages_auth.mmd')
        )
    })

    it('특수문자를 _ 로 치환', () => {
        const result = diagramCachePath('backend', 'some/weird:id@here')
        expect(result).toContain('some_weird_id_here.mmd')
    })
})
