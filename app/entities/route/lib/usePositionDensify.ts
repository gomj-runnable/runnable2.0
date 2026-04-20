import { lineString, along, length } from '@turf/turf'
import type { GeoJsonPosition } from '#shared/types/geojson'

const DENSIFY_STEP_METERS = 50

/**
 * 경로 위치 배열을 일정 간격(기본 50m)으로 보간하여 밀도를 높인다.
 * 고도는 0으로 초기화되며, 이후 지형 샘플링으로 채워진다.
 *
 * @param positions - 보간할 WGS84 좌표 배열
 * @param stepMeters - 보간 간격 (미터, 기본 50)
 * @returns 밀도가 높아진 WGS84 좌표 배열 (고도 = 0)
 */
export const densifyPositions = (
    positions: GeoJsonPosition[],
    stepMeters: number = DENSIFY_STEP_METERS
): GeoJsonPosition[] => {
    if (positions.length < 2) return [...positions]

    const coords = positions.map(([lng, lat]) => [lng, lat] as [number, number])
    const line = lineString(coords)
    const totalLengthMeters = length(line, { units: 'meters' })
    const result: GeoJsonPosition[] = []

    let cursor = 0
    while (cursor < totalLengthMeters) {
        const pt = along(line, cursor, { units: 'meters' })
        const [lng, lat] = pt.geometry.coordinates
        result.push([lng!, lat!, 0])
        cursor += stepMeters
    }

    const last = positions[positions.length - 1]!
    result.push([last[0], last[1], 0])
    return result
}
