import { describe, it, expect } from 'vitest'
import {
    getSectionColor,
    isGeoJsonLineString,
    extractLineStringGeometry,
    geomToRouteDrawPositions
} from '~/entities/route/lib/useRouteDrawUtils'
import { SECTION_COLORS } from '#shared/constants/route'
import type { GeoJsonLineString } from '#shared/types/geojson'

// ─── getSectionColor ──────────────────────────────────────────────────────
describe('getSectionColor', () => {
    it('인덱스 0은 첫 번째 색상이다', () => {
        expect(getSectionColor(0)).toBe(SECTION_COLORS[0])
    })

    it('인덱스가 배열 길이와 같으면 순환하여 첫 번째 색상이 반환된다', () => {
        expect(getSectionColor(SECTION_COLORS.length)).toBe(SECTION_COLORS[0])
    })

    it('각 인덱스가 대응하는 색상을 반환한다', () => {
        SECTION_COLORS.forEach((color, i) => {
            expect(getSectionColor(i)).toBe(color)
        })
    })

    it('배열 길이보다 큰 인덱스도 올바른 순환 색상을 반환한다', () => {
        expect(getSectionColor(SECTION_COLORS.length + 2)).toBe(SECTION_COLORS[2])
    })
})

// ─── isGeoJsonLineString ──────────────────────────────────────────────────
describe('isGeoJsonLineString', () => {
    it('올바른 LineString 객체에 대해 true를 반환한다', () => {
        const lineString: GeoJsonLineString = {
            type: 'LineString',
            coordinates: [[127, 37, 0], [128, 38, 0]]
        }
        expect(isGeoJsonLineString(lineString)).toBe(true)
    })

    it('null에 대해 false를 반환한다', () => {
        expect(isGeoJsonLineString(null)).toBe(false)
    })

    it('undefined에 대해 false를 반환한다', () => {
        expect(isGeoJsonLineString(undefined)).toBe(false)
    })

    it('type이 다르면 false를 반환한다', () => {
        expect(isGeoJsonLineString({ type: 'Point', coordinates: [127, 37] })).toBe(false)
    })

    it('coordinates가 없으면 false를 반환한다', () => {
        expect(isGeoJsonLineString({ type: 'LineString' })).toBe(false)
    })

    it('coordinates가 배열이 아니면 false를 반환한다', () => {
        expect(isGeoJsonLineString({ type: 'LineString', coordinates: 'invalid' })).toBe(false)
    })

    it('문자열에 대해 false를 반환한다', () => {
        expect(isGeoJsonLineString('LineString')).toBe(false)
    })
})

// ─── extractLineStringGeometry ────────────────────────────────────────────
describe('extractLineStringGeometry', () => {
    it('undefined이면 undefined를 반환한다', () => {
        expect(extractLineStringGeometry(undefined)).toBeUndefined()
    })

    it('LineString을 직접 전달하면 그대로 반환한다', () => {
        const geom: GeoJsonLineString = {
            type: 'LineString',
            coordinates: [[127, 37, 0], [128, 38, 0]]
        }
        expect(extractLineStringGeometry(geom)).toBe(geom)
    })

    it('Feature 형식에서 LineString geometry를 추출한다', () => {
        const feature = {
            type: 'Feature' as const,
            geometry: {
                type: 'LineString' as const,
                coordinates: [[127, 37, 0], [128, 38, 0]] as [number, number, number][]
            },
            properties: {}
        }
        const result = extractLineStringGeometry(feature as any)
        expect(result).toEqual(feature.geometry)
    })

    it('Feature의 geometry가 LineString이 아니면 undefined를 반환한다', () => {
        const feature = {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [127, 37] },
            properties: {}
        }
        expect(extractLineStringGeometry(feature as any)).toBeUndefined()
    })
})

// ─── geomToRouteDrawPositions ─────────────────────────────────────────────
describe('geomToRouteDrawPositions', () => {
    it('undefined이면 빈 배열을 반환한다', () => {
        expect(geomToRouteDrawPositions(undefined)).toEqual([])
    })

    it('좌표를 그대로 GeoJsonPosition 배열로 반환한다', () => {
        const geom: GeoJsonLineString = {
            type: 'LineString',
            coordinates: [[127, 37, 10], [128, 38, 20]]
        }
        const result = geomToRouteDrawPositions(geom)
        expect(result).toEqual([[127, 37, 10], [128, 38, 20]])
    })

    it('닫힌 링(첫 좌표와 마지막 좌표가 같음)은 마지막 포인트를 제거한다', () => {
        const geom: GeoJsonLineString = {
            type: 'LineString',
            coordinates: [[127, 37, 0], [128, 38, 0], [127, 37, 0]]
        }
        const result = geomToRouteDrawPositions(geom)
        expect(result).toHaveLength(2)
        expect(result[result.length - 1]).toEqual([128, 38, 0])
    })

    it('좌표가 1개이면 그대로 반환한다 (닫힌 링 처리 없음)', () => {
        const geom: GeoJsonLineString = {
            type: 'LineString',
            coordinates: [[127, 37, 0]]
        }
        expect(geomToRouteDrawPositions(geom)).toHaveLength(1)
    })
})
