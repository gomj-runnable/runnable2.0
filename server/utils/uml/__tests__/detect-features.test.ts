import { describe, it, expect, beforeAll } from 'vitest'
import { detectAllFeatures, findFeatures } from '../detect-features'
import type { FeaturesPayload } from '~~/shared/types/uml'

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
