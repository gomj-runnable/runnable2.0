// 경로 Repository — 인터페이스 정의 + Drizzle ORM 구현 (경로/구간/좋아요 CRUD 및 검색)
import { randomUUID } from 'node:crypto'
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm'
import type {
    RouteDraftInput,
    RouteSectionCreateInput,
    SavedRoute,
    SavedSection,
    SectionAttr
} from '#shared/types/route'
import type { GeoJsonLineString, GeoJsonPoint } from '#shared/types/geojson'
import type { PoiDraftInput, PoiType } from '#shared/types/facility'
import type { getDb } from '../database/client'
import { routes, routeSections, routeLikes } from '../database/schema/routes'
import { routeSectionPois } from '../database/schema/routeSectionPois'
import { users } from '../database/schema/users'

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

type Db = Awaited<ReturnType<typeof getDb>>

const safeParseJson = <T>(raw: string | null, fallback: T, label: string): T => {
    if (!raw) return fallback
    try {
        return JSON.parse(raw) as T
    } catch {
        console.warn(`[route.repository] JSON.parse failed for ${label}`)
        return fallback
    }
}

const escapeLikePattern = (str: string): string =>
    str.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')

const toSavedRoute = (row: typeof routes.$inferSelect, authorName?: string): SavedRoute => ({
    routeId: row.routeId,
    userId: row.userId,
    title: row.title,
    description: row.description ?? undefined,
    highHeight: row.highHeight ? Number(row.highHeight) : undefined,
    lowHeight: row.lowHeight ? Number(row.lowHeight) : undefined,
    distance: row.distance ? Number(row.distance) : undefined,
    isPublic: row.isPublic,
    sourceRouteId: row.sourceRouteId ?? undefined,
    sgg: safeParseJson<string[] | undefined>(row.sgg, undefined, 'sgg'),
    emd: safeParseJson<string[] | undefined>(row.emd, undefined, 'emd'),
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    createdAt: row.createdAt.toISOString(),
    authorName
})

/** 트랜잭션 핸들 타입 (db.transaction 콜백 인자) */
type DbTx = Parameters<Parameters<Db['transaction']>[0]>[0]

/** route_sections raw 행 (+ ST_AsGeoJSON(geom)) */
interface SectionRow {
    section_id: string
    route_id: string
    attrs: string | null
    geom: string | null
}

/** route_section_pois raw 행 (+ ST_AsGeoJSON(geom)) */
interface PoiRow {
    section_id: string
    type: string
    name: string
    description: string | null
    attribute: Record<string, unknown> | null
    geom: string | null
}

const parseLineGeom = (raw: string | null): GeoJsonLineString | undefined => {
    if (!raw) return undefined
    try {
        const parsed = JSON.parse(raw)
        if (parsed?.type === 'LineString') return parsed as GeoJsonLineString
    } catch {
        console.warn('[route.repository] LineString geom parse failed')
    }
    return undefined
}

const parsePointGeom = (raw: string | null): GeoJsonPoint => {
    if (raw) {
        try {
            const parsed = JSON.parse(raw)
            if (parsed?.type === 'Point') return parsed as GeoJsonPoint
        } catch {
            console.warn('[route.repository] Point geom parse failed')
        }
    }
    return { type: 'Point', coordinates: [0, 0] }
}

export class DrizzleRouteRepository implements IRouteRepository {
    constructor(private readonly db: Db) {}

    private routesWithAuthor() {
        return this.db.select().from(routes).leftJoin(users, eq(routes.userId, users.id))
    }

    async createRoute(input: RouteDraftInput, userId: string): Promise<SavedRoute> {
        const routeId = randomUUID()
        const [row] = await this.db
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
                sourceRouteId: input.sourceRouteId ?? null,
                sgg: input.sgg ? JSON.stringify(input.sgg) : null,
                emd: input.emd ? JSON.stringify(input.emd) : null
            })
            .returning()

        if (!row) throw new Error('Failed to create route')
        return toSavedRoute(row)
    }

    async getRoute(routeId: string): Promise<SavedRoute | null> {
        const rows = await this.routesWithAuthor().where(eq(routes.routeId, routeId)).limit(1)
        const row = rows[0]
        if (!row) return null
        return toSavedRoute(row.routes, row.users?.name)
    }

    async listRoutes(): Promise<SavedRoute[]> {
        const rows = await this.routesWithAuthor().orderBy(desc(routes.createdAt))
        return rows.map((r) => toSavedRoute(r.routes, r.users?.name))
    }

    async listRoutesByUser(userId: string): Promise<SavedRoute[]> {
        const rows = await this.db
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
            conditions.push(or(ilike(routes.title, pattern), ilike(routes.description, pattern))!)
        }

        const rows = await this.routesWithAuthor()
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

        const [row] = await this.db
            .update(routes)
            .set(values)
            .where(eq(routes.routeId, routeId))
            .returning()

        if (!row) return null
        return toSavedRoute(row)
    }

    async deleteRoute(routeId: string): Promise<boolean> {
        const result = await this.db.delete(routes).where(eq(routes.routeId, routeId)).returning()
        return result.length > 0
    }

    /** 구간 1건 + geom + POI 들을 한 트랜잭션으로 저장한다(facilities 패턴: 비공간 컬럼 Drizzle + geom raw). */
    private async insertSection(
        tx: DbTx,
        sectionId: string,
        routeId: string,
        input: CreateSectionInput
    ): Promise<void> {
        await tx.insert(routeSections).values({
            sectionId,
            routeId,
            attrs: input.attrs ? JSON.stringify(input.attrs) : null
        })
        if (input.geom) {
            await tx.execute(sql`
                UPDATE route_sections
                SET geom = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(input.geom)}), 4326))
                WHERE section_id = ${sectionId}
            `)
        }
        for (const poi of input.pois ?? []) {
            const poiId = randomUUID()
            await tx.insert(routeSectionPois).values({
                poiId,
                sectionId,
                type: poi.type,
                name: poi.name,
                description: poi.description ?? null,
                attribute: poi.attribute ?? null
            })
            await tx.execute(sql`
                UPDATE route_section_pois
                SET geom = ST_Force3D(ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(poi.geom)}), 4326))
                WHERE poi_id = ${poiId}
            `)
        }
    }

    async createSection(routeId: string, input: CreateSectionInput): Promise<SavedSection> {
        const sectionId = randomUUID()
        await this.db.transaction((tx) => this.insertSection(tx, sectionId, routeId, input))
        return { sectionId, routeId, geom: input.geom, attrs: input.attrs, pois: input.pois }
    }

    async createSections(routeId: string, inputs: CreateSectionInput[]): Promise<SavedSection[]> {
        if (inputs.length === 0) return []
        const sectionIds = inputs.map(() => randomUUID())
        await this.db.transaction(async (tx) => {
            for (let i = 0; i < inputs.length; i++) {
                await this.insertSection(tx, sectionIds[i]!, routeId, inputs[i]!)
            }
        })
        return inputs.map((input, i) => ({
            sectionId: sectionIds[i]!,
            routeId,
            geom: input.geom,
            attrs: input.attrs,
            pois: input.pois
        }))
    }

    async getSectionsByRouteId(routeId: string): Promise<SavedSection[]> {
        const sectionResult = await this.db.execute(sql`
            SELECT section_id, route_id, attrs, ST_AsGeoJSON(geom) AS geom
            FROM route_sections
            WHERE route_id = ${routeId}
        `)
        const sectionRows = sectionResult.rows as unknown as SectionRow[]
        if (sectionRows.length === 0) return []

        // 구간들에 연결된 POI 를 한 번에 조회해 sectionId 별로 묶는다
        const idsArray = `{${sectionRows.map((r) => r.section_id).join(',')}}`
        const poiResult = await this.db.execute(sql`
            SELECT section_id, type, name, description, attribute, ST_AsGeoJSON(geom) AS geom
            FROM route_section_pois
            WHERE section_id = ANY(${idsArray}::text[])
        `)
        const poiMap = new Map<string, PoiDraftInput[]>()
        for (const p of poiResult.rows as unknown as PoiRow[]) {
            const list = poiMap.get(p.section_id) ?? []
            list.push({
                name: p.name,
                description: p.description ?? undefined,
                type: p.type as PoiType,
                geom: parsePointGeom(p.geom),
                attribute: p.attribute ?? undefined
            })
            poiMap.set(p.section_id, list)
        }

        return sectionRows.map((r) => ({
            sectionId: r.section_id,
            routeId: r.route_id,
            geom: parseLineGeom(r.geom),
            attrs: safeParseJson<SectionAttr[] | undefined>(r.attrs, undefined, 'attrs'),
            pois: poiMap.get(r.section_id)
        }))
    }

    async deleteSectionsByRouteId(routeId: string): Promise<void> {
        await this.db.delete(routeSections).where(eq(routeSections.routeId, routeId))
    }

    async hasRouteFromSource(userId: string, sourceRouteId: string): Promise<boolean> {
        const rows = await this.db
            .select({ routeId: routes.routeId })
            .from(routes)
            .where(and(eq(routes.userId, userId), eq(routes.sourceRouteId, sourceRouteId)))
            .limit(1)
        return rows.length > 0
    }

    async incrementViewCount(routeId: string): Promise<void> {
        await this.db
            .update(routes)
            .set({ viewCount: sql`${routes.viewCount} + 1` })
            .where(eq(routes.routeId, routeId))
    }

    async likeRoute(userId: string, routeId: string): Promise<boolean> {
        const existing = await this.db
            .select()
            .from(routeLikes)
            .where(and(eq(routeLikes.userId, userId), eq(routeLikes.routeId, routeId)))
            .limit(1)

        if (existing.length > 0) return false

        await this.db.insert(routeLikes).values({ userId, routeId })
        await this.db
            .update(routes)
            .set({ likeCount: sql`${routes.likeCount} + 1` })
            .where(eq(routes.routeId, routeId))
        return true
    }

    async unlikeRoute(userId: string, routeId: string): Promise<boolean> {
        const result = await this.db
            .delete(routeLikes)
            .where(and(eq(routeLikes.userId, userId), eq(routeLikes.routeId, routeId)))
            .returning()

        if (result.length === 0) return false

        await this.db
            .update(routes)
            .set({ likeCount: sql`GREATEST(${routes.likeCount} - 1, 0)` })
            .where(eq(routes.routeId, routeId))
        return true
    }

    async isLikedByUser(userId: string, routeId: string): Promise<boolean> {
        const rows = await this.db
            .select()
            .from(routeLikes)
            .where(and(eq(routeLikes.userId, userId), eq(routeLikes.routeId, routeId)))
            .limit(1)
        return rows.length > 0
    }
}
