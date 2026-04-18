import { randomUUID } from 'node:crypto'
import { eq, and, ilike, or, desc } from 'drizzle-orm'
import type { RouteDraftInput, SectionAttr } from '#shared/types/route'
import type { GeoJsonLineString } from '#shared/types/geojson'
import type {
    IRouteRepository,
    SavedRoute,
    SavedSection,
    CreateSectionInput
} from './route.repository'
import { db as _db } from '../utils/db'
import { routes, routeSections } from '../database/schema/routes'
import { users } from '../database/schema/users'

function getDb() {
    if (!_db) throw new Error('DrizzleRouteRepository requires a database connection')
    return _db
}

/** routes 테이블에 users를 조인하는 공통 쿼리 베이스를 생성한다. */
const routesWithAuthor = () =>
    getDb().select().from(routes).leftJoin(users, eq(routes.userId, users.id))

const toSavedRoute = (
    row: typeof routes.$inferSelect,
    authorName?: string
): SavedRoute => ({
    routeId: row.routeId,
    userId: row.userId,
    title: row.title,
    description: row.description ?? undefined,
    highHeight: row.highHeight ? Number(row.highHeight) : undefined,
    lowHeight: row.lowHeight ? Number(row.lowHeight) : undefined,
    distance: row.distance ? Number(row.distance) : undefined,
    isPublic: row.isPublic,
    sgg: safeParseJson<string[] | undefined>(row.sgg, undefined, 'sgg'),
    emd: safeParseJson<string[] | undefined>(row.emd, undefined, 'emd'),
    createdAt: row.createdAt.toISOString(),
    authorName
})

const safeParseJson = <T>(raw: string | null, fallback: T, label: string): T => {
    if (!raw) return fallback
    try {
        return JSON.parse(raw) as T
    } catch {
        console.warn(`[route.repository.drizzle] JSON.parse failed for ${label}`)
        return fallback
    }
}

const escapeLikePattern = (str: string): string =>
    str.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')

const toSavedSection = (row: typeof routeSections.$inferSelect): SavedSection => ({
    sectionId: row.sectionId,
    routeId: row.routeId,
    geom: safeParseJson<GeoJsonLineString | undefined>(row.geom, undefined, 'geom'),
    attrs: safeParseJson<SectionAttr[] | undefined>(row.attrs, undefined, 'attrs')
})

class DrizzleRouteRepository implements IRouteRepository {
    async createRoute(input: RouteDraftInput, userId: string): Promise<SavedRoute> {
        const routeId = randomUUID()
        const [row] = await getDb()
            .insert(routes)
            .values({
                routeId,
                userId,
                title: input.title,
                description: input.description ?? null,
                highHeight: input.highHeight?.toString() ?? null,
                lowHeight: input.lowHeight?.toString() ?? null,
                distance: input.distance?.toString() ?? null,
                isPublic: input.isPublic ?? true,
                sgg: input.sgg ? JSON.stringify(input.sgg) : null,
                emd: input.emd ? JSON.stringify(input.emd) : null
            })
            .returning()

        if (!row) throw new Error('Failed to create route')
        return toSavedRoute(row)
    }

    async getRoute(routeId: string): Promise<SavedRoute | null> {
        const rows = await routesWithAuthor()
            .where(eq(routes.routeId, routeId))
            .limit(1)

        const row = rows[0]
        if (!row) return null
        return toSavedRoute(row.routes, row.users?.name)
    }

    async listRoutes(): Promise<SavedRoute[]> {
        const rows = await routesWithAuthor()
            .orderBy(desc(routes.createdAt))

        return rows.map((r) => toSavedRoute(r.routes, r.users?.name))
    }

    async listRoutesByUser(userId: string): Promise<SavedRoute[]> {
        const rows = await getDb()
            .select()
            .from(routes)
            .where(eq(routes.userId, userId))
            .orderBy(desc(routes.createdAt))

        return rows.map((r) => toSavedRoute(r))
    }

    async searchPublicRoutes(query?: string): Promise<SavedRoute[]> {
        const conditions = [eq(routes.isPublic, true)]

        if (query?.trim()) {
            const pattern = `%${escapeLikePattern(query.trim())}%`
            conditions.push(
                or(
                    ilike(routes.title, pattern),
                    ilike(routes.description, pattern)
                )!
            )
        }

        const rows = await routesWithAuthor()
            .where(and(...conditions))
            .orderBy(desc(routes.createdAt))
            .limit(50)

        return rows.map((r) => toSavedRoute(r.routes, r.users?.name))
    }

    async updateRoute(
        routeId: string,
        input: Partial<RouteDraftInput>
    ): Promise<SavedRoute | null> {
        const values: Partial<typeof routes.$inferInsert> = {}
        if (input.title !== undefined) values.title = input.title
        if (input.description !== undefined) values.description = input.description
        if (input.highHeight !== undefined) values.highHeight = input.highHeight?.toString()
        if (input.lowHeight !== undefined) values.lowHeight = input.lowHeight?.toString()
        if (input.distance !== undefined) values.distance = input.distance?.toString()
        if (input.isPublic !== undefined) values.isPublic = input.isPublic

        const [row] = await getDb()
            .update(routes)
            .set(values)
            .where(eq(routes.routeId, routeId))
            .returning()

        if (!row) return null
        return toSavedRoute(row)
    }

    async deleteRoute(routeId: string): Promise<boolean> {
        const result = await getDb().delete(routes).where(eq(routes.routeId, routeId)).returning()
        return result.length > 0
    }

    async createSection(routeId: string, input: CreateSectionInput): Promise<SavedSection> {
        const sectionId = randomUUID()
        const [row] = await getDb()
            .insert(routeSections)
            .values({
                sectionId,
                routeId,
                geom: input.geom ? JSON.stringify(input.geom) : null,
                attrs: input.attrs ? JSON.stringify(input.attrs) : null
            })
            .returning()

        if (!row) throw new Error('Failed to create section')
        return toSavedSection(row)
    }

    async createSections(routeId: string, inputs: CreateSectionInput[]): Promise<SavedSection[]> {
        if (inputs.length === 0) return []
        const rows = await getDb()
            .insert(routeSections)
            .values(
                inputs.map((input) => ({
                    sectionId: randomUUID(),
                    routeId,
                    geom: input.geom ? JSON.stringify(input.geom) : null,
                    attrs: input.attrs ? JSON.stringify(input.attrs) : null
                }))
            )
            .returning()
        return rows.map(toSavedSection)
    }

    async getSectionsByRouteId(routeId: string): Promise<SavedSection[]> {
        const rows = await getDb()
            .select()
            .from(routeSections)
            .where(eq(routeSections.routeId, routeId))

        return rows.map(toSavedSection)
    }
}

export const routeRepository: IRouteRepository = new DrizzleRouteRepository()
