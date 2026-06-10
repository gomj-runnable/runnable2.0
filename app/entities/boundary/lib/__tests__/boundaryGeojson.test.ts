import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BoundaryGeojson } from '../boundaryGeojson'

const makeFakeGeojson = (name: string): BoundaryGeojson => ({
    type: 'FeatureCollection',
    features: [
        {
            properties: { NAME: name, _labelPoint: [127, 37] },
            geometry: { type: 'Polygon', coordinates: [[[0, 0]]] }
        }
    ]
})

describe('loadBoundaryGeojson', () => {
    beforeEach(() => {
        // 모듈 스코프 cache/inflight 가 테스트 간 유지되므로 매번 초기화한다.
        vi.resetModules()
        vi.restoreAllMocks()
    })

    it('sgg 를 두 번 호출해도 $fetch 는 한 번만 호출하고 결과를 캐시한다', async () => {
        const fetchMock = vi.fn(async () => makeFakeGeojson('강남구'))
        vi.stubGlobal('$fetch', fetchMock)

        const { loadBoundaryGeojson } = await import('../boundaryGeojson')

        const first = await loadBoundaryGeojson('sgg')
        const second = await loadBoundaryGeojson('sgg')

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchMock).toHaveBeenCalledWith('/admin_area/sgg_4326.geojson')
        expect(second).toBe(first)
    })

    it('emd 는 /admin_area/emd_4326.geojson 을 fetch 한다', async () => {
        const fetchMock = vi.fn(async () => makeFakeGeojson('역삼동'))
        vi.stubGlobal('$fetch', fetchMock)

        const { loadBoundaryGeojson } = await import('../boundaryGeojson')

        const result = await loadBoundaryGeojson('emd')

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchMock).toHaveBeenCalledWith('/admin_area/emd_4326.geojson')
        expect(result.features[0]!.properties.NAME).toBe('역삼동')
    })

    it('동시 호출 시 in-flight Promise 를 공유해 중복 fetch 하지 않는다', async () => {
        const fetchMock = vi.fn(async () => makeFakeGeojson('서초구'))
        vi.stubGlobal('$fetch', fetchMock)

        const { loadBoundaryGeojson } = await import('../boundaryGeojson')

        const [a, b] = await Promise.all([loadBoundaryGeojson('sgg'), loadBoundaryGeojson('sgg')])

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(a).toBe(b)
    })
})
