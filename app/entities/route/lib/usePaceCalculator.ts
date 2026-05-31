// 구간·전체 경로의 거리·소요시간·페이스 포맷 계산 유틸리티 모음.
import type { SavedSection } from '#shared/types/route'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { UserPace } from '#shared/types/user-route'
import type { SectionPointRange } from '~/entities/route/lib/useRouteDrawDraft'
import { length as turfLength, lineString } from '@turf/turf'

/** 초를 "M'SS\"" 형식으로 변환 (예: 330 → "5'30\"") */
export const formatPace = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}'${String(s).padStart(2, '0')}"`
}

/** 초를 "H시간 M분" 형식으로 변환 */
export const formatTime = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    if (h > 0) return `${h}시간 ${m}분`
    return `${m}분`
}

/** GeoJSON LineString으로부터 구간 거리 계산 (km) */
export const calculateSectionDistance = (section: SavedSection): number => {
    if (!section.geom?.coordinates || section.geom.coordinates.length < 2) return 0
    const line = lineString(section.geom.coordinates)
    return turfLength(line, { units: 'kilometers' })
}

/** 포인트 배열과 범위로부터 구간 거리를 계산한다 (km). 그리기 모드용. */
export const calculateRangeDistance = (
    positions: GeoJsonPosition[],
    range: SectionPointRange
): number => {
    const coords = positions.slice(range.start, range.end + 1)
    if (coords.length < 2) return 0
    const line = lineString(coords.map((c) => [c[0], c[1]]))
    return turfLength(line, { units: 'kilometers' })
}

/** 전체 구간의 총 소요시간 계산 (초) */
export const calculateTotalTime = (
    sectionList: SavedSection[],
    paces: Record<string, UserPace>
): number => {
    return sectionList.reduce((total, section) => {
        const pace = paces[section.sectionId]?.pace ?? 330
        const distKm = calculateSectionDistance(section)
        return total + Math.round(pace * distKm)
    }, 0)
}

/** 전체 구간의 총 거리 계산 (km) */
export const calculateTotalDistance = (sectionList: SavedSection[]): number => {
    return sectionList.reduce((total, section) => total + calculateSectionDistance(section), 0)
}
