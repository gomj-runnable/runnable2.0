import { describe, it, expect, beforeEach } from 'vitest'
import {
    buildSpeedProfile,
    timeToDistanceProgress,
    DEFAULT_PACE_SEC_PER_KM
} from '~/features/simulation/lib/useSpeedProfile'
import { useSectionInfoStore } from '~/entities/route/model/useSectionInfoStore'

describe('buildSpeedProfile()', () => {
    let sectionInfo: ReturnType<typeof useSectionInfoStore>

    beforeEach(() => {
        sectionInfo = useSectionInfoStore()
        sectionInfo.sections.value = []
        sectionInfo.userPaces.value = {}
    })

    it('sections 가 없으면 기본 페이스 사용', () => {
        // 약 100m 직선
        const coords = [
            [127.0, 37.5],
            [127.001, 37.5]
        ]
        const profile = buildSpeedProfile(coords, sectionInfo)
        expect(profile.totalDurationMs).toBeGreaterThan(0)
        expect(profile.cumulativeTimeFractions).toHaveLength(2)
        expect(profile.cumulativeTimeFractions[0]).toBe(0)
        expect(profile.cumulativeTimeFractions.at(-1)).toBeCloseTo(1, 5)
    })

    it('좌표 1개 — totalDurationMs 기본 10000', () => {
        const profile = buildSpeedProfile([[127, 37]], sectionInfo)
        expect(profile.totalDurationMs).toBe(10000)
        expect(profile.cumulativeTimeFractions).toEqual([0])
    })

    it('userPaces 가 정의된 구간은 그 페이스 적용', () => {
        sectionInfo.sections.value = [
            {
                sectionId: 's-1',
                routeId: 'r-1',
                geom: {
                    type: 'LineString',
                    coordinates: [
                        [127.0, 37.5],
                        [127.001, 37.5]
                    ]
                },
                attrs: [],
                pois: []
            } as any
        ]
        sectionInfo.userPaces.value = {
            's-1': {
                userPaceId: '',
                userRouteId: '',
                sectionId: 's-1',
                pace: 300, // 5분/km
                weight: 0,
                strategy: ''
            } as any
        }

        const coords = [
            [127.0, 37.5],
            [127.001, 37.5]
        ]
        const profile = buildSpeedProfile(coords, sectionInfo)
        expect(profile.totalDurationMs).toBeGreaterThan(0)
    })

    it('마지막 구간을 넘어선 좌표는 마지막 구간 페이스 사용', () => {
        sectionInfo.sections.value = [
            {
                sectionId: 's-1',
                routeId: 'r-1',
                geom: {
                    type: 'LineString',
                    coordinates: [
                        [127.0, 37.5],
                        [127.0001, 37.5]
                    ]
                },
                attrs: [],
                pois: []
            } as any
        ]
        // 더 긴 좌표 배열 — 마지막 좌표는 sectionBoundaries 의 endDistance 를 넘음
        const coords = [
            [127.0, 37.5],
            [127.0001, 37.5],
            [127.001, 37.5],
            [127.005, 37.5]
        ]
        const profile = buildSpeedProfile(coords, sectionInfo)
        expect(profile.cumulativeTimeFractions).toHaveLength(4)
    })
})

describe('timeToDistanceProgress()', () => {
    it('len < 2 — timeProgress 그대로 반환', () => {
        expect(timeToDistanceProgress(0.3, [0])).toBe(0.3)
    })

    it('progress 0 → 0, 1 → 1', () => {
        const fractions = [0, 0.5, 1]
        expect(timeToDistanceProgress(0, fractions)).toBeCloseTo(0, 5)
        expect(timeToDistanceProgress(1, fractions)).toBeCloseTo(1, 5)
    })

    it('중간 progress 는 거리 진척율로 변환', () => {
        // 균등 페이스 — fractions = [0, 0.5, 1] → distance fractions = [0, 0.5, 1]
        const fractions = [0, 0.5, 1]
        expect(timeToDistanceProgress(0.5, fractions)).toBeCloseTo(0.5, 3)
    })

    it('빠른 구간 + 느린 구간 — 빠른 구간에서 더 많은 거리 진척', () => {
        // 시간상 50% 지점에서 80% 거리 진척 (앞 구간이 빠름)
        const fractions = [0, 0.2, 1] // [0, 0.5] distance, but time 0~0.2 → 0~0.5 distance
        const result = timeToDistanceProgress(0.1, fractions)
        // 시간 0.1 (구간 1 의 절반) → 거리 0.25
        expect(result).toBeCloseTo(0.25, 2)
    })
})

describe('DEFAULT_PACE_SEC_PER_KM', () => {
    it('360 (6:00/km)', () => {
        expect(DEFAULT_PACE_SEC_PER_KM).toBe(360)
    })
})
