import { randomUUID } from 'node:crypto'
import type { CreateRouteSchema } from '#shared/schemas/route.schema'
import type {
    IRouteRepository,
    SavedRoute,
    SavedSection,
    CreateSectionInput
} from './route.repository'

class InMemoryRouteRepository implements IRouteRepository {
    private readonly routes = new Map<string, SavedRoute>()
    private readonly sections = new Map<string, SavedSection>()

    async createRoute(input: CreateRouteSchema): Promise<SavedRoute> {
        const route: SavedRoute = { routeId: randomUUID(), ...input }
        this.routes.set(route.routeId, route)
        return route
    }

    async getRoute(routeId: string): Promise<SavedRoute | null> {
        return this.routes.get(routeId) ?? null
    }

    async listRoutes(): Promise<SavedRoute[]> {
        return Array.from(this.routes.values())
    }

    async updateRoute(
        routeId: string,
        input: Partial<CreateRouteSchema>
    ): Promise<SavedRoute | null> {
        const existing = this.routes.get(routeId)
        if (!existing) return null
        const updated = { ...existing, ...input }
        this.routes.set(routeId, updated)
        return updated
    }

    async deleteRoute(routeId: string): Promise<boolean> {
        return this.routes.delete(routeId)
    }

    async createSection(routeId: string, input: CreateSectionInput): Promise<SavedSection> {
        const section: SavedSection = { sectionId: randomUUID(), routeId, ...input }
        this.sections.set(section.sectionId, section)
        return section
    }

    async getSectionsByRouteId(routeId: string): Promise<SavedSection[]> {
        return Array.from(this.sections.values()).filter((s) => s.routeId === routeId)
    }
}

/** 서버 생애 주기 동안 유지되는 인메모리 저장소 싱글턴. Postgres 전환 시 이 export만 교체한다. */
export const routeRepository: IRouteRepository = new InMemoryRouteRepository()
