// 경로 정보 핀(RouteInfo) 타입 — CreateInput과 SavedRouteInfo 계층
import type { Facility } from '#shared/types/facility'
import type { GeoJsonPoint } from '#shared/types/geojson'

/** 경로 정보 핀 생성 입력 (CreateInput) */
export type RouteInfoCreateInput = Pick<Facility, 'name'> & { description: string } & {
    /** 위치 — GeoJSON Point. coordinates = [lng, lat] 또는 [lng, lat, elevation] */
    geom: GeoJsonPoint
}

/** 저장된 경로 정보 핀 (DB 조회 결과, routeInfoId 포함) */
export interface SavedRouteInfo extends RouteInfoCreateInput {
    routeInfoId: string
    routeId: string
    userId: string
    authorName: string
    createdAt?: string
}
