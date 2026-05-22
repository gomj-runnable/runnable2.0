import { describe, it, expect } from 'vitest'
import {
    createRouteElevationProfile,
    createRouteElevationProfileFromDraft,
    createRouteElevationProfileFromSections,
    createDistanceTicks,
    buildDraftSectionInputs,
    buildSavedSectionInputs
} from '~/entities/route/lib/useRouteElevationProfile'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { SavedSection } from '#shared/types/route'

const sec = (positions: GeoJsonPosition[], label = 'S', color = '#fff') => ({
    label,
    color,
    positions
})

describe('createRouteElevationProfile()', () => {
    it('빈 입력은 null', () => {
        expect(createRouteElevationProfile([])).toBeNull()
    })

    it('positions 가 모두 비어 있어도 null', () => {
        expect(createRouteElevationProfile([sec([])])).toBeNull()
    })

    it('단일 구간 — 누적 거리/고도 계산', () => {
        const positions: GeoJsonPosition[] = [
            [127.0, 37.0, 100],
            [127.001, 37.0, 110],
            [127.002, 37.0, 90]
        ]
        const profile = createRouteElevationProfile([sec(positions, '구간1', '#ff0')])
        expect(profile).not.toBeNull()
        expect(profile!.points).toHaveLength(3)
        expect(profile!.points[0]!.distanceKm).toBe(0)
        expect(profile!.elevationGain).toBe(10)
        expect(profile!.elevationLoss).toBe(20)
        expect(profile!.maxElevation).toBe(110)
        expect(profile!.minElevation).toBe(90)
        expect(profile!.sections).toHaveLength(1)
        expect(profile!.sections[0]!.label).toBe('구간1')
    })

    it('같은 좌표 연속 — 중복 좌표는 거리 누적/포인트 추가 모두 스킵', () => {
        const positions: GeoJsonPosition[] = [
            [127.0, 37.0, 100],
            [127.0, 37.0, 100], // 중복
            [127.001, 37.0, 100]
        ]
        const profile = createRouteElevationProfile([sec(positions)])
        expect(profile!.points).toHaveLength(2)
    })

    it('이전 구간의 마지막 좌표 = 다음 구간 첫 좌표 → endpoint 공유', () => {
        const profile = createRouteElevationProfile([
            sec(
                [
                    [127.0, 37.0, 100],
                    [127.001, 37.0, 110]
                ],
                'A'
            ),
            sec(
                [
                    [127.001, 37.0, 110], // 공유
                    [127.002, 37.0, 120]
                ],
                'B'
            )
        ])
        expect(profile!.points).toHaveLength(3)
        expect(profile!.sections).toHaveLength(2)
        // 두번째 구간의 startIndex 는 첫번째 구간 endIndex(1) 와 동일
        expect(profile!.sections[0]!.endIndex).toBe(profile!.sections[1]!.startIndex)
    })

    it('elevation 누락 시 0 으로 처리 (z 없음)', () => {
        const positions: GeoJsonPosition[] = [
            [127.0, 37.0],
            [127.001, 37.0]
        ]
        const profile = createRouteElevationProfile([sec(positions)])
        expect(profile!.elevationGain).toBe(0)
        expect(profile!.elevationLoss).toBe(0)
        expect(profile!.points[0]!.elevation).toBe(0)
    })
})

describe('createRouteElevationProfileFromDraft()', () => {
    it('positions + ranges 로 buildDraftSectionInputs 와 동일한 결과', () => {
        const positions: GeoJsonPosition[] = [
            [127.0, 37.0, 100],
            [127.001, 37.0, 110],
            [127.002, 37.0, 105]
        ]
        const ranges = [{ start: 0, end: 2 }]
        const profile = createRouteElevationProfileFromDraft(positions, ranges)
        expect(profile).not.toBeNull()
        expect(profile!.sections[0]!.label).toBe('구간 1')
    })

    it('sectionNames 제공 시 그 이름을 사용', () => {
        const positions: GeoJsonPosition[] = [
            [127.0, 37.0, 100],
            [127.001, 37.0, 110]
        ]
        const profile = createRouteElevationProfileFromDraft(
            positions,
            [{ start: 0, end: 1 }],
            [{ name: '한강대교 구간' }]
        )
        expect(profile!.sections[0]!.label).toBe('한강대교 구간')
    })

    it('빈 이름 trim 후 비면 기본 라벨', () => {
        const profile = createRouteElevationProfileFromDraft(
            [
                [127.0, 37.0, 100],
                [127.001, 37.0, 110]
            ],
            [{ start: 0, end: 1 }],
            [{ name: '   ' }]
        )
        expect(profile!.sections[0]!.label).toBe('구간 1')
    })
})

describe('createRouteElevationProfileFromSections()', () => {
    it('SavedSection.geom 의 좌표를 추출해 프로필 생성', () => {
        const sections: SavedSection[] = [
            {
                sectionId: 's1',
                routeId: 'r1',
                geom: {
                    type: 'LineString',
                    coordinates: [
                        [127.0, 37.0, 50],
                        [127.001, 37.0, 60]
                    ]
                },
                attrs: [{ seq: 0, name: '시작 구간' }],
                pois: []
            } as unknown as SavedSection
        ]
        const profile = createRouteElevationProfileFromSections(sections)
        expect(profile).not.toBeNull()
        expect(profile!.sections[0]!.label).toBe('시작 구간')
        expect(profile!.elevationGain).toBe(10)
    })
})

describe('createDistanceTicks()', () => {
    it('distanceKm <= 0 은 [0]', () => {
        expect(createDistanceTicks(0)).toEqual([0])
        expect(createDistanceTicks(-1)).toEqual([0])
    })

    it('1km — 0/0.5/1.0 의 3개 tick', () => {
        expect(createDistanceTicks(1)).toEqual([0, 0.5, 1])
    })

    it('1.2km — 마지막 tick 은 정확히 1.2', () => {
        const ticks = createDistanceTicks(1.2)
        expect(ticks[0]).toBe(0)
        expect(ticks[ticks.length - 1]).toBe(1.2)
    })
})

describe('buildDraftSectionInputs()', () => {
    it('range.start ~ range.end (inclusive) 로 slice', () => {
        const positions: GeoJsonPosition[] = Array.from(
            { length: 5 },
            (_, i) => [127 + i * 0.001, 37, i] as GeoJsonPosition
        )
        const inputs = buildDraftSectionInputs(positions, [{ start: 1, end: 3 }])
        expect(inputs[0]!.positions).toHaveLength(3) // index 1, 2, 3
        expect(inputs[0]!.label).toBe('구간 1')
    })
})

describe('buildSavedSectionInputs()', () => {
    it('attrs[0].name 이 있으면 label 로 사용', () => {
        const sections: SavedSection[] = [
            {
                sectionId: 's1',
                routeId: 'r1',
                geom: { type: 'LineString', coordinates: [[127, 37, 0]] },
                attrs: [{ seq: 0, name: '한강' }],
                pois: []
            } as unknown as SavedSection
        ]
        const inputs = buildSavedSectionInputs(sections)
        expect(inputs[0]!.label).toBe('한강')
    })
})
