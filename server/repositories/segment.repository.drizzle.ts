import { randomUUID } from 'node:crypto'
import { eq, desc, asc, sql } from 'drizzle-orm'
import type { ISegmentRepository } from './segment.repository'
import type {
    SegmentDraftInput,
    SavedSegment,
    SegmentEffortDraftInput,
    SavedSegmentEffort,
    SegmentLeaderboard
} from '#shared/types/segment'
import type { getDb } from '../database/client'
import { segments, segmentEfforts } from '../database/schema/segments'
import { users } from '../database/schema/users'

type Db = Awaited<ReturnType<typeof getDb>>

const toSavedSegment = (
    row: typeof segments.$inferSelect,
    ownerName?: string | null
): SavedSegment => ({
    segmentId: row.segmentId,
    ownerId: row.ownerId,
    ownerName: ownerName ?? undefined,
    name: row.name,
    description: row.description ?? undefined,
    routeId: row.routeId,
    startPositionIndex: row.startPositionIndex,
    endPositionIndex: row.endPositionIndex,
    distanceKm: Number(row.distanceKm),
    elevationGainM: row.elevationGainM ? Number(row.elevationGainM) : undefined,
    isPublic: row.isPublic,
    effortCount: row.effortCount,
    createdAt: row.createdAt.toISOString()
})

const toSavedEffort = (
    row: typeof segmentEfforts.$inferSelect,
    userName?: string | null
): SavedSegmentEffort => ({
    effortId: row.effortId,
    segmentId: row.segmentId,
    userId: row.userId,
    userName: userName ?? undefined,
    durationSec: row.durationSec,
    paceSecPerKm: Number(row.paceSecPerKm),
    completedAt: row.completedAt.toISOString()
})

export class DrizzleSegmentRepository implements ISegmentRepository {
    constructor(private readonly db: Db) {}

    async createSegment(input: SegmentDraftInput, ownerId: string): Promise<SavedSegment> {
        const segmentId = randomUUID()
        const [row] = await this.db
            .insert(segments)
            .values({
                segmentId,
                ownerId,
                name: input.name,
                description: input.description,
                routeId: input.routeId,
                startPositionIndex: input.startPositionIndex,
                endPositionIndex: input.endPositionIndex,
                distanceKm: String(input.distanceKm),
                elevationGainM: input.elevationGainM ? String(input.elevationGainM) : null,
                isPublic: input.isPublic ?? true
            })
            .returning()
        if (!row) throw new Error('Failed to create segment')
        return toSavedSegment(row)
    }

    async getSegment(segmentId: string): Promise<SavedSegment | null> {
        const rows = await this.db
            .select()
            .from(segments)
            .leftJoin(users, eq(segments.ownerId, users.id))
            .where(eq(segments.segmentId, segmentId))
            .limit(1)
        const row = rows[0]
        if (!row) return null
        return toSavedSegment(row.segments, row.users?.name)
    }

    async listPublicSegments(): Promise<SavedSegment[]> {
        const rows = await this.db
            .select()
            .from(segments)
            .leftJoin(users, eq(segments.ownerId, users.id))
            .where(eq(segments.isPublic, true))
            .orderBy(desc(segments.effortCount))
        return rows.map((r) => toSavedSegment(r.segments, r.users?.name))
    }

    async listSegmentsByRoute(routeId: string): Promise<SavedSegment[]> {
        const rows = await this.db
            .select()
            .from(segments)
            .leftJoin(users, eq(segments.ownerId, users.id))
            .where(eq(segments.routeId, routeId))
            .orderBy(desc(segments.createdAt))
        return rows.map((r) => toSavedSegment(r.segments, r.users?.name))
    }

    async listSegmentsByOwner(ownerId: string): Promise<SavedSegment[]> {
        const rows = await this.db
            .select()
            .from(segments)
            .where(eq(segments.ownerId, ownerId))
            .orderBy(desc(segments.createdAt))
        return rows.map((r) => toSavedSegment(r))
    }

    async deleteSegment(segmentId: string): Promise<boolean> {
        const result = await this.db
            .delete(segments)
            .where(eq(segments.segmentId, segmentId))
            .returning()
        return result.length > 0
    }

    async createEffort(
        input: SegmentEffortDraftInput,
        userId: string
    ): Promise<SavedSegmentEffort> {
        const effortId = randomUUID()
        const [row] = await this.db
            .insert(segmentEfforts)
            .values({
                effortId,
                segmentId: input.segmentId,
                userId,
                durationSec: input.durationSec,
                paceSecPerKm: String(input.paceSecPerKm)
            })
            .returning()
        if (!row) throw new Error('Failed to create effort')

        // Increment effort count
        await this.db
            .update(segments)
            .set({ effortCount: sql`${segments.effortCount} + 1` })
            .where(eq(segments.segmentId, input.segmentId))

        return toSavedEffort(row)
    }

    async getLeaderboard(
        segmentId: string,
        userId?: string,
        limit = 10
    ): Promise<SegmentLeaderboard> {
        const segment = await this.getSegment(segmentId)
        if (!segment) {
            return {
                segmentId,
                segmentName: '',
                distanceKm: 0,
                top: [],
                userRank: null,
                userBest: null,
                totalEfforts: 0
            }
        }

        // Top efforts (best time per user, then pick top N)
        const topRows = await this.db
            .select()
            .from(segmentEfforts)
            .leftJoin(users, eq(segmentEfforts.userId, users.id))
            .where(eq(segmentEfforts.segmentId, segmentId))
            .orderBy(asc(segmentEfforts.durationSec))
            .limit(limit)

        const top = topRows.map((r) => toSavedEffort(r.segment_efforts, r.users?.name))

        // Count total efforts
        const [countRow] = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(segmentEfforts)
            .where(eq(segmentEfforts.segmentId, segmentId))
        const totalEfforts = countRow?.count ?? 0

        // User rank and best
        let userRank: number | null = null
        let userBest: SavedSegmentEffort | null = null

        if (userId) {
            const userRows = await this.db
                .select()
                .from(segmentEfforts)
                .where(
                    sql`${segmentEfforts.segmentId} = ${segmentId} AND ${segmentEfforts.userId} = ${userId}`
                )
                .orderBy(asc(segmentEfforts.durationSec))
                .limit(1)

            if (userRows[0]) {
                userBest = toSavedEffort(userRows[0])
                // Calculate rank
                const [rankRow] = await this.db
                    .select({ rank: sql<number>`count(*)::int + 1` })
                    .from(segmentEfforts)
                    .where(
                        sql`${segmentEfforts.segmentId} = ${segmentId} AND ${segmentEfforts.durationSec} < ${userRows[0].durationSec}`
                    )
                userRank = rankRow?.rank ?? null
            }
        }

        return {
            segmentId,
            segmentName: segment.name,
            distanceKm: segment.distanceKm,
            top,
            userRank,
            userBest,
            totalEfforts
        }
    }

    async listEffortsByUser(userId: string): Promise<SavedSegmentEffort[]> {
        const rows = await this.db
            .select()
            .from(segmentEfforts)
            .where(eq(segmentEfforts.userId, userId))
            .orderBy(desc(segmentEfforts.completedAt))
        return rows.map((r) => toSavedEffort(r))
    }
}
