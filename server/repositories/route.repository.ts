import type { CreateRouteSchema, SectionAttrSchema } from '#shared/schemas/route.schema'
import type { SavedRoute, SavedSection } from '#shared/types/route'

export type { SavedRoute, SavedSection }

/** 구간 생성 입력. routeId는 저장소가 내부적으로 연결한다. */
export type CreateSectionInput = {
    geom?: string
    attrs?: SectionAttrSchema[]
}

/**
 * 경로 저장소 어댑터 인터페이스.
 * 구현체(InMemory, Postgres 등)만 교체하면 저장 방식을 변경할 수 있다.
 */
export interface IRouteRepository {
    createRoute(input: CreateRouteSchema): Promise<SavedRoute>
    getRoute(routeId: string): Promise<SavedRoute | null>
    listRoutes(): Promise<SavedRoute[]>
    updateRoute(routeId: string, input: Partial<CreateRouteSchema>): Promise<SavedRoute | null>
    deleteRoute(routeId: string): Promise<boolean>
    createSection(routeId: string, input: CreateSectionInput): Promise<SavedSection>
    getSectionsByRouteId(routeId: string): Promise<SavedSection[]>
}