import type {
    RouteDraftInput,
    RouteSectionCreateInput,
    SavedRoute,
    SavedSection
} from '#shared/types/route'

export type { SavedRoute, SavedSection }

/** 구간 생성 입력. routeId는 저장소가 내부적으로 연결한다. */
export type CreateSectionInput = RouteSectionCreateInput

/**
 * 경로 저장소 어댑터 인터페이스.
 * 구현체(InMemory, Postgres 등)만 교체하면 저장 방식을 변경할 수 있다.
 */
export interface IRouteRepository {
    createRoute(input: RouteDraftInput, userId: string): Promise<SavedRoute>
    getRoute(routeId: string): Promise<SavedRoute | null>
    listRoutes(): Promise<SavedRoute[]>
    listRoutesByUser(userId: string): Promise<SavedRoute[]>
    searchPublicRoutes(query?: string): Promise<SavedRoute[]>
    updateRoute(routeId: string, input: Partial<RouteDraftInput>): Promise<SavedRoute | null>
    deleteRoute(routeId: string): Promise<boolean>
    createSection(routeId: string, input: CreateSectionInput): Promise<SavedSection>
    createSections(routeId: string, inputs: CreateSectionInput[]): Promise<SavedSection[]>
    getSectionsByRouteId(routeId: string): Promise<SavedSection[]>
    /** 경로의 모든 구간을 삭제한다 */
    deleteSectionsByRouteId(routeId: string): Promise<void>
    /** 특정 사용자가 이미 해당 원본 경로를 가져왔는지 확인한다 */
    hasRouteFromSource(userId: string, sourceRouteId: string): Promise<boolean>
    /** 경로 조회수를 1 증가시킨다 */
    incrementViewCount(routeId: string): Promise<void>
    /** 경로에 좋아요를 추가하고 likeCount를 증가시킨다. 이미 좋아요한 경우 false를 반환한다 */
    likeRoute(userId: string, routeId: string): Promise<boolean>
    /** 경로 좋아요를 취소하고 likeCount를 감소시킨다. 좋아요하지 않은 경우 false를 반환한다 */
    unlikeRoute(userId: string, routeId: string): Promise<boolean>
    /** 특정 사용자가 해당 경로에 좋아요했는지 확인한다 */
    isLikedByUser(userId: string, routeId: string): Promise<boolean>
}
