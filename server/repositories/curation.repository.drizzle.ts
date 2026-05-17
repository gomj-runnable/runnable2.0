import { randomUUID } from 'node:crypto'
import { eq, and, lte, gte, desc, sql } from 'drizzle-orm'
import type { ICurationRepository } from './curation.repository'
import type {
    CurationCollectionDraftInput,
    SavedCurationCollection,
    CurationRouteDraftInput,
    SavedCurationRoute,
    CurationSeason,
    CurationTheme
} from '#shared/types/curation'
import type { getDb } from '../database/client'
import { curationCollections, curationRoutes } from '../database/schema/curations'

type Db = Awaited<ReturnType<typeof getDb>>

const toSavedCollection = (
    row: typeof curationCollections.$inferSelect
): SavedCurationCollection => ({
    collectionId: row.collectionId,
    createdBy: row.createdBy,
    title: row.title,
    description: row.description ?? undefined,
    season: row.season as CurationSeason,
    theme: row.theme as CurationTheme,
    validFrom: row.validFrom,
    validTo: row.validTo,
    coverImageUrl: row.coverImageUrl ?? undefined,
    routeCount: row.routeCount,
    createdAt: row.createdAt.toISOString()
})

const toSavedRoute = (row: typeof curationRoutes.$inferSelect): SavedCurationRoute => ({
    curationRouteId: row.curationRouteId,
    collectionId: row.collectionId,
    routeId: row.routeId,
    recommendedHourLocal: row.recommendedHourLocal ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    note: row.note ?? undefined,
    sortOrder: row.sortOrder
})

export class DrizzleCurationRepository implements ICurationRepository {
    constructor(private readonly db: Db) {}

    async createCollection(
        input: CurationCollectionDraftInput,
        createdBy: string
    ): Promise<SavedCurationCollection> {
        const collectionId = randomUUID()
        const [row] = await this.db
            .insert(curationCollections)
            .values({
                collectionId,
                createdBy,
                title: input.title,
                description: input.description ?? null,
                season: input.season,
                theme: input.theme,
                validFrom: input.validFrom,
                validTo: input.validTo,
                coverImageUrl: input.coverImageUrl ?? null
            })
            .returning()
        if (!row) throw new Error('Failed to create curation collection')
        return toSavedCollection(row)
    }

    async getCollection(collectionId: string): Promise<SavedCurationCollection | null> {
        const [row] = await this.db
            .select()
            .from(curationCollections)
            .where(eq(curationCollections.collectionId, collectionId))
            .limit(1)
        return row ? toSavedCollection(row) : null
    }

    async listActiveCollections(today: string): Promise<SavedCurationCollection[]> {
        const rows = await this.db
            .select()
            .from(curationCollections)
            .where(
                and(
                    lte(curationCollections.validFrom, today),
                    gte(curationCollections.validTo, today)
                )
            )
            .orderBy(desc(curationCollections.createdAt))
        return rows.map(toSavedCollection)
    }

    async listAllCollections(): Promise<SavedCurationCollection[]> {
        const rows = await this.db
            .select()
            .from(curationCollections)
            .orderBy(desc(curationCollections.createdAt))
        return rows.map(toSavedCollection)
    }

    async deleteCollection(collectionId: string): Promise<boolean> {
        const result = await this.db
            .delete(curationCollections)
            .where(eq(curationCollections.collectionId, collectionId))
            .returning()
        return result.length > 0
    }

    async addRoute(
        collectionId: string,
        input: CurationRouteDraftInput
    ): Promise<SavedCurationRoute> {
        const curationRouteId = randomUUID()
        const [row] = await this.db
            .insert(curationRoutes)
            .values({
                curationRouteId,
                collectionId,
                routeId: input.routeId,
                recommendedHourLocal: input.recommendedHourLocal ?? null,
                photoUrl: input.photoUrl ?? null,
                note: input.note ?? null,
                sortOrder: input.sortOrder
            })
            .returning()
        if (!row) throw new Error('Failed to add curation route')

        // Update route count
        await this.db
            .update(curationCollections)
            .set({ routeCount: sql`${curationCollections.routeCount} + 1` })
            .where(eq(curationCollections.collectionId, collectionId))

        return toSavedRoute(row)
    }

    async listRoutes(collectionId: string): Promise<SavedCurationRoute[]> {
        const rows = await this.db
            .select()
            .from(curationRoutes)
            .where(eq(curationRoutes.collectionId, collectionId))
            .orderBy(curationRoutes.sortOrder)
        return rows.map(toSavedRoute)
    }

    async removeRoute(curationRouteId: string): Promise<boolean> {
        const [removed] = await this.db
            .delete(curationRoutes)
            .where(eq(curationRoutes.curationRouteId, curationRouteId))
            .returning()
        if (removed) {
            await this.db
                .update(curationCollections)
                .set({ routeCount: sql`greatest(${curationCollections.routeCount} - 1, 0)` })
                .where(eq(curationCollections.collectionId, removed.collectionId))
        }
        return !!removed
    }
}
