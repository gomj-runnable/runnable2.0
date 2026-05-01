import type { SavedRouteInfo } from '#shared/types/routeInfo'

export type { SavedRouteInfo }

/** 새 경로정보 생성 입력 타입 */
export interface NewRouteInfo {
    routeInfoId: string
    routeId: string
    userId: string
    name: string
    description: string
    lng: string
    lat: string
    elevation: string | null
    authorName: string
}

/**
 * 경로정보 저장소 어댑터 인터페이스.
 * 구현체(InMemory, Postgres 등)만 교체하면 저장 방식을 변경할 수 있다.
 */
export interface IRouteInfoRepository {
    findByRouteId(routeId: string): Promise<SavedRouteInfo[]>
    create(routeInfo: NewRouteInfo): Promise<SavedRouteInfo>
}
