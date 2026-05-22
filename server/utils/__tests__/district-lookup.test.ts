import { describe, it, expect, vi, beforeEach } from 'vitest'

const boundaryMock = vi.hoisted(() => ({
    getSggBoundary: vi.fn(),
    getEmdBoundary: vi.fn()
}))

vi.mock('../district/boundary', () => boundaryMock)

// 강남구 코드 11680 — seoul-gu-data 와 일치해야 EMD 그룹화 캐시가 매핑된다.
function makeSquare(lngMin: number, latMin: number, lngMax: number, latMax: number) {
    return {
        type: 'Feature' as const,
        geometry: {
            type: 'Polygon' as const,
            coordinates: [
                [
                    [lngMin, latMin],
                    [lngMax, latMin],
                    [lngMax, latMax],
                    [lngMin, latMax],
                    [lngMin, latMin]
                ]
            ]
        }
    }
}

describe('lookupDistricts()', () => {
    beforeEach(() => {
        vi.resetModules()
        boundaryMock.getSggBoundary.mockReset()
        boundaryMock.getEmdBoundary.mockReset()
    })

    it('빈 좌표 배열은 빈 결과를 반환', async () => {
        const { lookupDistricts } = await import('../district-lookup')
        const result = await lookupDistricts([])
        expect(result).toEqual({ sgg: [], emd: [] })
        expect(boundaryMock.getSggBoundary).not.toHaveBeenCalled()
    })

    it('SGG/EMD polygon 안에 들어가면 이름 수집', async () => {
        boundaryMock.getSggBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: [
                {
                    ...makeSquare(127, 37.5, 127.1, 37.55),
                    properties: { SIG_KOR_NM: '강남구' }
                }
            ]
        })
        boundaryMock.getEmdBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: [
                {
                    ...makeSquare(127, 37.5, 127.05, 37.52),
                    properties: { EMD_CD: '1168010100', EMD_KOR_NM: '역삼동' }
                }
            ]
        })

        const { lookupDistricts } = await import('../district-lookup')
        const result = await lookupDistricts([[127.01, 37.51]])
        expect(result.sgg).toEqual(['강남구'])
        expect(result.emd).toEqual(['역삼동'])
    })

    it('polygon 밖 좌표는 매칭되지 않음', async () => {
        boundaryMock.getSggBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: [
                {
                    ...makeSquare(127, 37.5, 127.1, 37.55),
                    properties: { SIG_KOR_NM: '강남구' }
                }
            ]
        })
        boundaryMock.getEmdBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: []
        })

        const { lookupDistricts } = await import('../district-lookup')
        const result = await lookupDistricts([[126.5, 37.0]])
        expect(result).toEqual({ sgg: [], emd: [] })
    })

    it('boundary fetch 실패 시 빈 결과를 반환', async () => {
        boundaryMock.getSggBoundary.mockRejectedValue(new Error('network'))
        boundaryMock.getEmdBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: []
        })

        const { lookupDistricts } = await import('../district-lookup')
        const result = await lookupDistricts([[127.01, 37.51]])
        expect(result).toEqual({ sgg: [], emd: [] })
    })

    it('SIG_KOR_NM 누락된 feature 는 스킵', async () => {
        boundaryMock.getSggBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: [
                {
                    ...makeSquare(127, 37.5, 127.1, 37.55),
                    properties: {}
                },
                {
                    ...makeSquare(127, 37.5, 127.1, 37.55),
                    properties: { SIG_KOR_NM: '강남구' }
                }
            ]
        })
        boundaryMock.getEmdBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: []
        })

        const { lookupDistricts } = await import('../district-lookup')
        const result = await lookupDistricts([[127.01, 37.51]])
        expect(result.sgg).toEqual(['강남구'])
    })

    it('Polygon 이 아닌 feature(Point 등) 는 스킵', async () => {
        boundaryMock.getSggBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [127, 37] },
                    properties: { SIG_KOR_NM: '강남구' }
                },
                {
                    ...makeSquare(127, 37.5, 127.1, 37.55),
                    properties: { SIG_KOR_NM: '강남구' }
                }
            ]
        })
        boundaryMock.getEmdBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: []
        })

        const { lookupDistricts } = await import('../district-lookup')
        const result = await lookupDistricts([[127.01, 37.51]])
        expect(result.sgg).toEqual(['강남구'])
    })

    it('EMD_CD 의 시군구 prefix 가 GU_BY_CODE 와 일치하지 않으면 그룹화에서 제외', async () => {
        boundaryMock.getSggBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: [
                {
                    ...makeSquare(127, 37.5, 127.1, 37.55),
                    properties: { SIG_KOR_NM: '강남구' }
                }
            ]
        })
        boundaryMock.getEmdBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: [
                {
                    ...makeSquare(127, 37.5, 127.05, 37.52),
                    properties: { EMD_CD: '99999XXXXX', EMD_KOR_NM: '없는동' }
                }
            ]
        })

        const { lookupDistricts } = await import('../district-lookup')
        const result = await lookupDistricts([[127.01, 37.51]])
        expect(result.sgg).toEqual(['강남구'])
        expect(result.emd).toEqual([])
    })

    it('좌표 50개 이상 — sampling stride 가 적용되고 마지막 좌표 포함', async () => {
        boundaryMock.getSggBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: [
                {
                    ...makeSquare(127, 37.5, 127.1, 37.55),
                    properties: { SIG_KOR_NM: '강남구' }
                }
            ]
        })
        boundaryMock.getEmdBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: []
        })

        const { lookupDistricts } = await import('../district-lookup')
        const coords: [number, number][] = Array.from(
            { length: 120 },
            (_, i) => [127 + i * 0.00001, 37.51] as [number, number]
        )
        const result = await lookupDistricts(coords)
        expect(result.sgg).toEqual(['강남구'])
    })

    it('두 번째 호출 시 EMD 캐시 사용 — getEmdBoundary 는 1회만 호출', async () => {
        boundaryMock.getSggBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: []
        })
        boundaryMock.getEmdBoundary.mockResolvedValue({
            type: 'FeatureCollection',
            features: []
        })

        const { lookupDistricts } = await import('../district-lookup')
        await lookupDistricts([[127.01, 37.51]])
        await lookupDistricts([[127.02, 37.52]])
        expect(boundaryMock.getEmdBoundary).toHaveBeenCalledTimes(1)
    })
})
