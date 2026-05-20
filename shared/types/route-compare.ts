import type { SavedRoute, SavedSection } from './route'

/**
 * 경로 비교 지표 (#189).
 *
 * 거리/누적 상승/예상 시간/시설물 카운트를 한 데로 집계한 메타.
 * `/api/route-compare` 응답이나 비교 UI 의 카드 표시용.
 */
export interface RouteCompareMeta {
    /** 총 거리 (km). turf.length 기반. */
    distanceKm: number
    /** 누적 상승고도 (m). z 좌표 양수 차이 합. */
    ascentM: number
    /** 누적 하강고도 (m). z 좌표 음수 차이 합의 절대값. */
    descentM: number
    /** 예상 소요시간 (분). 기본 페이스 6:00/km. */
    estimatedDurationMin: number
    /** 경로 주변 시설물 카운트. key 는 FacilityType 문자열. */
    facilityCounts: Record<string, number>
}

/**
 * 단일 경로의 비교 응답 항목 (#188).
 * 경로 메타데이터·sections·집계 메트릭을 한 번에 반환한다.
 */
export interface RouteCompareItem {
    route: SavedRoute
    sections: SavedSection[]
    meta: RouteCompareMeta
}

/**
 * `/api/routes/compare` 응답 (#188).
 */
export interface RouteCompareResponse {
    routeA: RouteCompareItem
    routeB: RouteCompareItem
}
