import { describe, it, expect } from 'vitest'
import {
    findNearestSection,
    generatePoiComment,
    validatePoiDistance
} from '~/entities/route/lib/usePoiSnapping'

describe('findNearestSection()', () => {
    const poi = { type: 'Point' as const, coordinates: [127.001, 37.0] as [number, number] }

    it('section 이 없으면 null', () => {
        expect(findNearestSection(poi, [])).toBeNull()
    })

    it('coordinates 가 2개 미만인 구간은 스킵', () => {
        expect(
            findNearestSection(poi, [
                { geom: { coordinates: [[127, 37]] } },
                { geom: undefined }
            ] as any)
        ).toBeNull()
    })

    it('가장 가까운 구간 index 와 거리 반환', () => {
        const result = findNearestSection(poi, [
            {
                geom: {
                    coordinates: [
                        [127.5, 37.0],
                        [127.6, 37.0]
                    ]
                }
            },
            {
                geom: {
                    coordinates: [
                        [127.0, 37.0],
                        [127.002, 37.0]
                    ]
                }
            }
        ] as any)
        expect(result).not.toBeNull()
        expect(result!.sectionIndex).toBe(1)
        expect(result!.distanceMeters).toBeLessThan(100)
        expect(result!.nearestPoint[0]).toBeCloseTo(127.001, 2)
    })
})

describe('generatePoiComment()', () => {
    it('반올림된 거리 + 시설명 문구', () => {
        expect(generatePoiComment('약수터', 12.4)).toBe('12m 거리에 약수터이(가) 있습니다.')
        expect(generatePoiComment('화장실', 49.7)).toBe('50m 거리에 화장실이(가) 있습니다.')
    })
})

describe('validatePoiDistance()', () => {
    it('200m 미만 → ok', () => {
        expect(validatePoiDistance(0)).toBe('ok')
        expect(validatePoiDistance(199.99)).toBe('ok')
    })

    it('200~500m → warning (200 경계 포함)', () => {
        expect(validatePoiDistance(200)).toBe('warning')
        expect(validatePoiDistance(499.99)).toBe('warning')
    })

    it('500m 이상 → blocked', () => {
        expect(validatePoiDistance(500)).toBe('blocked')
        expect(validatePoiDistance(1000)).toBe('blocked')
    })
})
