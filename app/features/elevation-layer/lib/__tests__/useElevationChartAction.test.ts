import { describe, it, expect } from 'vitest'
import { calcChartGeometry } from '~/features/elevation-layer/lib/useElevationChartAction'
import type { RouteElevationProfile } from '#shared/types/route'

const dims = {
    width: 400,
    height: 200,
    padding: { top: 10, right: 10, bottom: 20, left: 30 }
}

const sampleProfile = (overrides: Partial<RouteElevationProfile> = {}): RouteElevationProfile => ({
    points: [
        { distanceKm: 0, elevation: 50 },
        { distanceKm: 0.5, elevation: 80 },
        { distanceKm: 1.0, elevation: 60 }
    ],
    sections: [
        { label: 'A', color: '#f00', startIndex: 0, endIndex: 1 },
        { label: 'B', color: '#0f0', startIndex: 1, endIndex: 2 }
    ],
    distanceKm: 1.0,
    minElevation: 50,
    maxElevation: 80,
    elevationGain: 30,
    elevationLoss: 20,
    highestPoint: { distanceKm: 0.5, elevation: 80 },
    lowestPoint: { distanceKm: 0, elevation: 50 },
    ...overrides
})

describe('calcChartGeometry()', () => {
    it('points 가 비어 있으면 null', () => {
        const profile = sampleProfile({ points: [] })
        expect(calcChartGeometry(profile, [0, 1], dims)).toBeNull()
    })

    it('정상 — linePoints, sectionSegments, baselineY, ticks 모두 반환', () => {
        const geom = calcChartGeometry(sampleProfile(), [0, 0.5, 1.0], dims)
        expect(geom).not.toBeNull()
        expect(geom!.linePoints).toHaveLength(3)
        expect(geom!.sectionSegments).toHaveLength(2)
        expect(geom!.distanceTicks).toHaveLength(3)
        expect(geom!.baselineY).toBe(
            dims.padding.top + (dims.height - dims.padding.top - dims.padding.bottom)
        )
        expect(geom!.areaPath).toContain('M')
        expect(geom!.areaPath).toContain('Z')
    })

    it('highestPoint/lowestPoint 매칭', () => {
        const geom = calcChartGeometry(sampleProfile(), [0, 1], dims)
        expect(geom!.highestPoint).not.toBeNull()
        expect(geom!.highestPoint!.elevation).toBe(80)
        expect(geom!.lowestPoint!.elevation).toBe(50)
    })

    it('section 의 길이가 1 미만이면 segment 제외', () => {
        const profile = sampleProfile({
            sections: [
                { label: 'A', color: '#f00', startIndex: 0, endIndex: 0 }, // 1개 포인트만 — 제외
                { label: 'B', color: '#0f0', startIndex: 0, endIndex: 2 }
            ]
        })
        const geom = calcChartGeometry(profile, [0, 1], dims)
        expect(geom!.sectionSegments).toHaveLength(1)
    })

    it('distanceKm=0 인 프로필도 안전 (maxDistance=0.001 으로 protect)', () => {
        const profile = sampleProfile({
            distanceKm: 0,
            points: [{ distanceKm: 0, elevation: 50 }],
            sections: []
        })
        const geom = calcChartGeometry(profile, [0], dims)
        expect(geom).not.toBeNull()
        expect(geom!.linePoints).toHaveLength(1)
    })

    it('elevation range 0 (모두 동일 고도) 도 NaN 없이 처리', () => {
        const profile = sampleProfile({
            points: [
                { distanceKm: 0, elevation: 100 },
                { distanceKm: 1, elevation: 100 }
            ],
            minElevation: 100,
            maxElevation: 100,
            highestPoint: { distanceKm: 0, elevation: 100 },
            lowestPoint: { distanceKm: 0, elevation: 100 }
        })
        const geom = calcChartGeometry(profile, [0, 1], dims)
        expect(geom!.linePoints.every((p) => Number.isFinite(p.y))).toBe(true)
    })
})
