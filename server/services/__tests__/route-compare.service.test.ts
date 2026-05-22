import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
    computeDistanceKm,
    computeAscentM,
    computeDescentM,
    estimateDurationMin,
    sampleCoords,
    routeCompareService
} from '../route-compare.service'
import type { Position } from 'geojson'

const routeRepo = vi.hoisted(() => ({
    getSectionsByRouteId: vi.fn()
}))
const facilityRepo = vi.hoisted(() => ({
    findNearby: vi.fn()
}))

vi.mock('../../repositories', () => ({
    getRouteRepository: vi.fn(async () => routeRepo),
    getFacilityRepository: vi.fn(async () => facilityRepo)
}))

describe('computeDistanceKm()', () => {
    it('좌표가 1개 이하면 0', () => {
        expect(computeDistanceKm([])).toBe(0)
        expect(computeDistanceKm([[126.97, 37.56]])).toBe(0)
    })

    it('동일 좌표 2개의 거리는 0', () => {
        const coords: Position[] = [
            [126.97, 37.56],
            [126.97, 37.56]
        ]
        expect(computeDistanceKm(coords)).toBeCloseTo(0, 5)
    })

    it('서울 → 부산 ≈ 325km (대원거리 근사)', () => {
        const coords: Position[] = [
            [126.97, 37.56],
            [129.07, 35.18]
        ]
        const km = computeDistanceKm(coords)
        expect(km).toBeGreaterThan(320)
        expect(km).toBeLessThan(330)
    })
})

describe('computeAscentM()', () => {
    it('빈 배열 또는 단일점은 0', () => {
        expect(computeAscentM([])).toBe(0)
        expect(computeAscentM([[0, 0, 100]])).toBe(0)
    })

    it('z 좌표가 없는 점들은 0', () => {
        const coords: Position[] = [
            [0, 0],
            [0, 0.01],
            [0, 0.02]
        ]
        expect(computeAscentM(coords)).toBe(0)
    })

    it('상승 차이만 합산', () => {
        // 0 → 10 → 5 → 15: 상승 = 10 + 10 = 20
        const coords: Position[] = [
            [0, 0, 0],
            [0, 0, 10],
            [0, 0, 5],
            [0, 0, 15]
        ]
        expect(computeAscentM(coords)).toBe(20)
    })

    it('내리막만 있으면 0', () => {
        const coords: Position[] = [
            [0, 0, 50],
            [0, 0, 30],
            [0, 0, 10]
        ]
        expect(computeAscentM(coords)).toBe(0)
    })
})

describe('computeDescentM()', () => {
    it('하강 차이만 양수로 합산', () => {
        // 100 → 80 → 90 → 50: 하강 = 20 + 40 = 60
        const coords: Position[] = [
            [0, 0, 100],
            [0, 0, 80],
            [0, 0, 90],
            [0, 0, 50]
        ]
        expect(computeDescentM(coords)).toBe(60)
    })

    it('오르막만 있으면 0', () => {
        const coords: Position[] = [
            [0, 0, 0],
            [0, 0, 10]
        ]
        expect(computeDescentM(coords)).toBe(0)
    })
})

describe('estimateDurationMin()', () => {
    it('기본 페이스 6:00/km — 5km → 30분', () => {
        expect(estimateDurationMin(5)).toBe(30)
    })

    it('사용자 페이스 5:30/km — 10km → 55분', () => {
        expect(estimateDurationMin(10, 5.5)).toBe(55)
    })

    it('0km 은 0분', () => {
        expect(estimateDurationMin(0)).toBe(0)
    })
})

describe('sampleCoords()', () => {
    it('stride <= 1 은 원본 그대로', () => {
        const coords: Position[] = [
            [0, 0],
            [1, 1],
            [2, 2]
        ]
        expect(sampleCoords(coords, 1)).toBe(coords)
        expect(sampleCoords(coords, 0)).toBe(coords)
    })

    it('빈 배열은 빈 배열', () => {
        expect(sampleCoords([], 5)).toEqual([])
    })

    it('stride 간격으로 샘플링하되 마지막 좌표를 포함', () => {
        const coords: Position[] = Array.from({ length: 11 }, (_, i) => [i, i] as Position)
        // stride 5 → 인덱스 0, 5, 10 + 마지막(10 — 이미 포함이므로 중복 X)
        const sampled = sampleCoords(coords, 5)
        expect(sampled).toEqual([
            [0, 0],
            [5, 5],
            [10, 10]
        ])
    })

    it('마지막 좌표가 stride 배수가 아니면 추가로 포함', () => {
        const coords: Position[] = Array.from({ length: 12 }, (_, i) => [i, i] as Position)
        // stride 5 → 인덱스 0, 5, 10 + 마지막(11)
        const sampled = sampleCoords(coords, 5)
        expect(sampled).toEqual([
            [0, 0],
            [5, 5],
            [10, 10],
            [11, 11]
        ])
    })
})

describe('routeCompareService.computeMeta()', () => {
    beforeEach(() => {
        routeRepo.getSectionsByRouteId.mockReset()
        facilityRepo.findNearby.mockReset()
    })

    it('sections 가 비어 있으면 0 메타 + 시설물 카운트는 모두 0', async () => {
        routeRepo.getSectionsByRouteId.mockResolvedValue([])
        const meta = await routeCompareService.computeMeta('r-1')
        expect(meta.distanceKm).toBe(0)
        expect(meta.ascentM).toBe(0)
        expect(meta.descentM).toBe(0)
        expect(meta.estimatedDurationMin).toBe(0)
        expect(meta.facilityCounts).toEqual({
            sidewalk: 0,
            crosswalk: 0,
            fountain: 0,
            locker: 0,
            hospital: 0,
            toilet: 0
        })
        // 좌표가 0개라서 시설물 조회는 호출되지 않음
        expect(facilityRepo.findNearby).not.toHaveBeenCalled()
    })

    it('section 의 z 좌표로 ascent/descent, distance, duration 을 계산', async () => {
        routeRepo.getSectionsByRouteId.mockResolvedValue([
            {
                geom: {
                    coordinates: [
                        [127, 37, 0],
                        [127.001, 37.001, 10],
                        [127.002, 37.002, 5]
                    ]
                }
            }
        ])
        facilityRepo.findNearby.mockResolvedValue([])

        const meta = await routeCompareService.computeMeta('r-1', 5)
        expect(meta.ascentM).toBe(10)
        expect(meta.descentM).toBe(5)
        expect(meta.distanceKm).toBeGreaterThan(0)
        expect(meta.estimatedDurationMin).toBeCloseTo(meta.distanceKm * 5, 5)
    })

    it('시설물 카운트는 type 별로 누적되고 동일 id 는 중복 카운트하지 않음', async () => {
        // stride 10 — 좌표 21개라면 sample 은 [0, 10, 20] 3개
        const coords = Array.from({ length: 21 }, (_, i) => [127 + i * 0.0001, 37, 0])
        routeRepo.getSectionsByRouteId.mockResolvedValue([{ geom: { coordinates: coords } }])

        facilityRepo.findNearby
            .mockResolvedValueOnce([
                { id: 'f-1', type: 'sidewalk' },
                { id: 'f-2', type: 'crosswalk' }
            ])
            .mockResolvedValueOnce([
                { id: 'f-1', type: 'sidewalk' }, // 중복 — 무시
                { id: 'f-3', type: 'fountain' }
            ])
            .mockResolvedValueOnce([])

        const meta = await routeCompareService.computeMeta('r-1')
        expect(meta.facilityCounts.sidewalk).toBe(1)
        expect(meta.facilityCounts.crosswalk).toBe(1)
        expect(meta.facilityCounts.fountain).toBe(1)
        expect(meta.facilityCounts.hospital).toBe(0)
    })

    it('id 가 없는 시설물도 type 카운트는 누적 (중복 검사 스킵)', async () => {
        routeRepo.getSectionsByRouteId.mockResolvedValue([
            { geom: { coordinates: [[127, 37, 0]] } }
        ])
        facilityRepo.findNearby.mockResolvedValueOnce([
            { type: 'toilet' },
            { type: 'toilet' },
            { type: 'hospital' }
        ])

        const meta = await routeCompareService.computeMeta('r-1')
        expect(meta.facilityCounts.toilet).toBe(2)
        expect(meta.facilityCounts.hospital).toBe(1)
    })

    it('section.geom 이 undefined 이면 좌표 없이 진행', async () => {
        routeRepo.getSectionsByRouteId.mockResolvedValue([{ geom: undefined }, { geom: null }])
        const meta = await routeCompareService.computeMeta('r-1')
        expect(meta.distanceKm).toBe(0)
        expect(facilityRepo.findNearby).not.toHaveBeenCalled()
    })

    it('좌표의 lng/lat 가 undefined 면 해당 좌표는 시설물 조회 스킵', async () => {
        routeRepo.getSectionsByRouteId.mockResolvedValue([
            {
                geom: {
                    coordinates: [
                        [undefined, 37],
                        [127, 37]
                    ]
                }
            }
        ])
        facilityRepo.findNearby.mockResolvedValue([])

        await routeCompareService.computeMeta('r-1')
        // sampling 은 [0번, 마지막] 둘 다 sample 에 포함되지만 lng=undefined 인 0번은 skip → 1회만 호출
        expect(facilityRepo.findNearby).toHaveBeenCalledTimes(1)
        expect(facilityRepo.findNearby).toHaveBeenCalledWith(37, 127, 50, expect.any(Array))
    })
})
