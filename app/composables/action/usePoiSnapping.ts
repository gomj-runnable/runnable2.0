import { nearestPointOnLine, point, lineString } from '@turf/turf'
import type { GeoJsonPoint } from '#shared/types/geojson'

export interface NearestSectionResult {
    sectionIndex: number
    distanceMeters: number
    nearestPoint: [number, number]
}

export type PoiDistanceStatus = 'ok' | 'warning' | 'blocked'

/**
 * POI 좌표와 구간 Polyline들을 비교하여 가장 가까운 구간과 거리를 반환한다.
 * @param poiGeom - POI의 GeoJSON Point
 * @param sections - 구간 목록 (geom.coordinates가 있는 객체 배열)
 */
export const findNearestSection = (
    poiGeom: GeoJsonPoint,
    sections: { geom?: { coordinates: number[][] } }[]
): NearestSectionResult | null => {
    let best: NearestSectionResult | null = null

    const poiPt = point(poiGeom.coordinates as [number, number])

    for (let i = 0; i < sections.length; i++) {
        const geom = sections[i]?.geom
        if (!geom?.coordinates || geom.coordinates.length < 2) continue

        const line = lineString(geom.coordinates.map((c) => [c[0]!, c[1]!] as [number, number]))
        const snapped = nearestPointOnLine(line, poiPt, { units: 'meters' })

        const dist = snapped.properties.dist ?? 0

        if (!best || dist < best.distanceMeters) {
            best = {
                sectionIndex: i,
                distanceMeters: dist,
                nearestPoint: snapped.geometry.coordinates as [number, number]
            }
        }
    }

    return best
}

/**
 * 시설물 연결 코멘트를 생성한다.
 * @returns "{distance}m 거리에 {name}이(가) 있습니다."
 */
export const generatePoiComment = (facilityName: string, distanceMeters: number): string => {
    return `${Math.round(distanceMeters)}m 거리에 ${facilityName}이(가) 있습니다.`
}

/**
 * POI와 구간 사이 거리를 검증한다.
 * - 200m 미만: ok
 * - 200~500m: warning
 * - 500m 이상: blocked
 */
export const validatePoiDistance = (distanceMeters: number): PoiDistanceStatus => {
    if (distanceMeters >= 500) return 'blocked'
    if (distanceMeters >= 200) return 'warning'
    return 'ok'
}
