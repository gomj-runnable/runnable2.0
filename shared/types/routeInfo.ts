// 경로 정보 핀(RouteInfo) 타입 — DraftInput과 SavedRouteInfo 계층
import type { Facility } from '#shared/types/facility'

/** 경로 정보 핀 생성 입력 (DraftInput) */
export type RouteInfoDraftInput = Pick<Facility, 'name'> & { description: string } & {
    lng: number
    lat: number
    elevation?: number
}

/** 저장된 경로 정보 핀 (DB 조회 결과, routeInfoId 포함) */
export interface SavedRouteInfo extends RouteInfoDraftInput {
    routeInfoId: string
    routeId: string
    userId: string
    authorName: string
    createdAt?: string
}
