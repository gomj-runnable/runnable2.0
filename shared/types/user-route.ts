// 사용자-경로 연결(UserRoute) 및 페이스 관련 타입
export type { UserPace, CreateUserPaceInput } from '#shared/schemas/user-route.schema'

/** 사용자가 저장한 경로 연결 엔티티 */
export interface UserRoute {
    userRouteId: string
    userId: string
    categoryId: string
    routeId: string
}
