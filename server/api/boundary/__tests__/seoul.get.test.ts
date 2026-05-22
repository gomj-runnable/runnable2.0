import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../seoul.get'
import { SEOUL_GU_DATA } from '../../../utils/district/seoul-gu-data'

const { getSggBoundary } = vi.hoisted(() => ({ getSggBoundary: vi.fn() }))
vi.mock('../../../utils/district/boundary', () => ({ getSggBoundary }))

describe('GET /api/boundary/seoul', () => {
    beforeEach(() => {
        getSggBoundary.mockReset()
    })

    it('getSggBoundary() 가 성공하면 그 결과를 반환한다', async () => {
        const fixture = { type: 'FeatureCollection', features: [{ id: 1 }] }
        getSggBoundary.mockResolvedValue(fixture)

        const result = await handler({} as any)

        expect(result).toBe(fixture)
    })

    it('getSggBoundary() 가 실패하면 SEOUL_GU_DATA 기반 원형 fallback geojson 을 반환한다', async () => {
        getSggBoundary.mockRejectedValue(new Error('boundary fetch failed'))

        const result = (await handler({} as any)) as any

        expect(result.type).toBe('FeatureCollection')
        expect(result.features).toHaveLength(SEOUL_GU_DATA.length)
        const first = result.features[0]
        expect(first.type).toBe('Feature')
        expect(first.properties.SIG_KOR_NM).toBe(SEOUL_GU_DATA[0].name)
        expect(first.properties.SIG_CD).toBe(SEOUL_GU_DATA[0].code)
        expect(first.geometry.type).toBe('Polygon')
        // 원형 폴리곤은 16분할 + 시작점 닫힘 = 17개 좌표
        expect(first.geometry.coordinates[0]).toHaveLength(17)
    })
})
