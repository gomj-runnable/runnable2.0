import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import type { FeaturesPayload } from '~~/shared/types/uml'

import {
    findFeatures,
    writeFeaturesCache,
    getOrDetectFeatures,
    loadFeaturesCache,
    detectAllFeatures
} from '../detect-features'

// 캐시 경로를 테스트마다 격리된 tmp 경로로 redirect 한다.
// vi.mock 은 hoist 되므로 path 도 factory 안에서 계산한다.
vi.mock('../paths', async () => {
    const path = await import('node:path')
    const os = await import('node:os')
    const crypto = await import('node:crypto')
    const root = path.join(os.tmpdir(), `uml-cache-test-${crypto.randomUUID()}`)
    return {
        repoRoot: process.cwd(),
        umlCacheDir: root,
        featuresCachePath: path.join(root, 'features.json'),
        diagramCachePath: (domain: string, featureId: string) =>
            path.join(root, domain, `${featureId.replace(/[^a-z0-9_-]/gi, '_')}.mmd`)
    }
})

// 모킹된 paths 모듈에서 실제 사용된 tmp 경로를 가져온다.
const { umlCacheDir: tmpRoot, featuresCachePath: tmpCachePath } = await import('../paths')

const payload: FeaturesPayload = {
    scannedAt: '2026-01-01T00:00:00Z',
    features: [
        {
            id: 'frontend:pages:auth',
            domain: 'frontend',
            name: 'pages/auth',
            paths: ['app/pages/auth'],
            fileCount: 3,
            detectedAt: '2026-01-01T00:00:00Z'
        },
        {
            id: 'frontend:widgets:map',
            domain: 'frontend',
            name: 'widgets/map',
            paths: ['app/widgets/map'],
            fileCount: 5,
            detectedAt: '2026-01-01T00:00:00Z'
        },
        {
            id: 'backend:api:auth',
            domain: 'backend',
            name: 'api/auth',
            paths: ['server/api/auth'],
            fileCount: 2,
            detectedAt: '2026-01-01T00:00:00Z'
        }
    ]
}

describe('findFeatures()', () => {
    it('도메인과 ID 가 일치하는 Feature 만 반환', () => {
        const result = findFeatures(payload, 'frontend', ['frontend:pages:auth'])
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('frontend:pages:auth')
    })

    it('다른 도메인의 ID 는 반환하지 않음', () => {
        const result = findFeatures(payload, 'frontend', ['backend:api:auth'])
        expect(result).toHaveLength(0)
    })

    it('여러 ID 를 한 번에 필터링', () => {
        const result = findFeatures(payload, 'frontend', [
            'frontend:pages:auth',
            'frontend:widgets:map'
        ])
        expect(result).toHaveLength(2)
    })

    it('존재하지 않는 ID 는 무시', () => {
        const result = findFeatures(payload, 'frontend', ['frontend:pages:nonexistent'])
        expect(result).toHaveLength(0)
    })

    it('빈 ID 배열이면 빈 배열 반환', () => {
        const result = findFeatures(payload, 'frontend', [])
        expect(result).toHaveLength(0)
    })
})

describe('writeFeaturesCache() — cache poisoning 방어', () => {
    beforeEach(async () => {
        await fs.rm(tmpRoot, { recursive: true, force: true })
    })

    afterEach(async () => {
        await fs.rm(tmpRoot, { recursive: true, force: true })
        vi.restoreAllMocks()
    })

    it('features 배열이 비어있으면 fs.writeFile 을 호출하지 않는다', async () => {
        const writeSpy = vi.spyOn(fs, 'writeFile')
        await writeFeaturesCache({ features: [], scannedAt: '2026-01-01T00:00:00Z' })
        expect(writeSpy).not.toHaveBeenCalled()
        // 캐시 파일도 생성되지 않아야 한다
        await expect(fs.access(tmpCachePath)).rejects.toThrow()
    })

    it('features 가 비어있지 않으면 정상적으로 캐시를 쓴다', async () => {
        await writeFeaturesCache(payload)
        const raw = await fs.readFile(tmpCachePath, 'utf-8')
        const parsed = JSON.parse(raw) as FeaturesPayload
        expect(parsed.features).toHaveLength(payload.features.length)
    })
})

describe('getOrDetectFeatures() — 빈 캐시 무시', () => {
    beforeEach(async () => {
        await fs.rm(tmpRoot, { recursive: true, force: true })
    })

    afterEach(async () => {
        await fs.rm(tmpRoot, { recursive: true, force: true })
        vi.restoreAllMocks()
    })

    it('캐시가 빈 배열이면 무시하고 detectAllFeatures 를 재실행한다', async () => {
        // 1) 빈 캐시를 미리 디스크에 둔다 (poisoned 상태 재현)
        await fs.mkdir(tmpRoot, { recursive: true })
        await fs.writeFile(
            tmpCachePath,
            JSON.stringify({ features: [], scannedAt: '2026-01-01T00:00:00Z' }),
            'utf-8'
        )
        // 사전 조건: loadFeaturesCache 로 읽으면 features 가 비어있다
        const pre = await loadFeaturesCache()
        expect(pre?.features).toHaveLength(0)

        // 2) getOrDetectFeatures 가 빈 캐시를 무시하고 실제 detect 를 돌려야 한다.
        //    process.cwd() = 워크트리 루트라 app/, server/ 가 존재 → detect 결과 > 0.
        const result = await getOrDetectFeatures()
        expect(result.features.length).toBeGreaterThan(0)

        // 3) 새 detect 결과로 캐시가 덮어쓰여 더 이상 비어있지 않아야 한다.
        const after = await loadFeaturesCache()
        expect(after?.features.length).toBeGreaterThan(0)
    })
})

describe('detectAllFeatures() integration', () => {
    let result: FeaturesPayload

    beforeAll(async () => {
        result = await detectAllFeatures()
    })

    it('frontend 도메인에서 최소 1개 이상 detect 한다', () => {
        const frontend = result.features.filter((f) => f.domain === 'frontend')
        expect(frontend.length).toBeGreaterThan(0)
    })

    it('backend 도메인에서 최소 1개 이상 detect 한다', () => {
        const backend = result.features.filter((f) => f.domain === 'backend')
        expect(backend.length).toBeGreaterThan(0)
    })

    it('library 도메인에서 최소 1개 이상 detect 한다', () => {
        const library = result.features.filter((f) => f.domain === 'library')
        expect(library.length).toBeGreaterThan(0)
    })

    it('frontend/backend 도메인의 fileCount 총합이 0 보다 크다 (전부 빈 detect 회귀 방어)', () => {
        const totalSource = result.features
            .filter((f) => f.domain === 'frontend' || f.domain === 'backend')
            .reduce((sum, f) => sum + f.fileCount, 0)
        expect(totalSource).toBeGreaterThan(0)
    })
})
