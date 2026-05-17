import { randomUUID } from 'node:crypto'
import { eq, and, gte, lt, desc, sql } from 'drizzle-orm'
import type { IRunRecordRepository } from './run-record.repository'
import type {
    RunRecordDraftInput,
    SavedRunRecord,
    RunInsightWeekly,
    ConditionLevel
} from '#shared/types/run-record'
import type { getDb } from '../database/client'
import { runRecords } from '../database/schema/runRecords'

type Db = Awaited<ReturnType<typeof getDb>>

const toSaved = (row: typeof runRecords.$inferSelect): SavedRunRecord => ({
    recordId: row.recordId,
    userId: row.userId,
    routeId: row.routeId ?? undefined,
    runDate: row.runDate,
    distanceKm: Number(row.distanceKm),
    durationSec: row.durationSec,
    avgPaceSecPerKm: Number(row.avgPaceSecPerKm),
    rpe: row.rpe,
    condition: row.condition as ConditionLevel,
    sleepHours: row.sleepHours ? Number(row.sleepHours) : undefined,
    stressLevel: row.stressLevel ?? undefined,
    painAreas: row.painAreas ?? undefined,
    weatherSnapshot: row.weatherSnapshot ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString()
})

export class DrizzleRunRecordRepository implements IRunRecordRepository {
    constructor(private readonly db: Db) {}

    async create(input: RunRecordDraftInput, userId: string): Promise<SavedRunRecord> {
        const recordId = randomUUID()
        const [row] = await this.db
            .insert(runRecords)
            .values({
                recordId,
                userId,
                routeId: input.routeId ?? null,
                runDate: input.runDate,
                distanceKm: String(input.distanceKm),
                durationSec: input.durationSec,
                avgPaceSecPerKm: String(input.avgPaceSecPerKm),
                rpe: input.rpe,
                condition: input.condition,
                sleepHours: input.sleepHours != null ? String(input.sleepHours) : null,
                stressLevel: input.stressLevel ?? null,
                painAreas: input.painAreas ?? null,
                weatherSnapshot: input.weatherSnapshot ?? null,
                notes: input.notes ?? null
            })
            .returning()
        if (!row) throw new Error('Failed to create run record')
        return toSaved(row)
    }

    async getById(recordId: string): Promise<SavedRunRecord | null> {
        const [row] = await this.db
            .select()
            .from(runRecords)
            .where(eq(runRecords.recordId, recordId))
            .limit(1)
        return row ? toSaved(row) : null
    }

    async listByUser(userId: string, limit = 50, offset = 0): Promise<SavedRunRecord[]> {
        const rows = await this.db
            .select()
            .from(runRecords)
            .where(eq(runRecords.userId, userId))
            .orderBy(desc(runRecords.runDate))
            .limit(limit)
            .offset(offset)
        return rows.map(toSaved)
    }

    async update(
        recordId: string,
        input: Partial<RunRecordDraftInput>
    ): Promise<SavedRunRecord | null> {
        const updates: Record<string, unknown> = {}
        if (input.rpe != null) updates.rpe = input.rpe
        if (input.condition != null) updates.condition = input.condition
        if (input.sleepHours != null) updates.sleepHours = String(input.sleepHours)
        if (input.stressLevel != null) updates.stressLevel = input.stressLevel
        if (input.painAreas !== undefined) updates.painAreas = input.painAreas
        if (input.notes !== undefined) updates.notes = input.notes

        if (Object.keys(updates).length === 0) return this.getById(recordId)

        const [row] = await this.db
            .update(runRecords)
            .set(updates)
            .where(eq(runRecords.recordId, recordId))
            .returning()
        return row ? toSaved(row) : null
    }

    async delete(recordId: string): Promise<boolean> {
        const result = await this.db
            .delete(runRecords)
            .where(eq(runRecords.recordId, recordId))
            .returning()
        return result.length > 0
    }

    async getWeeklyInsight(userId: string, weekStart: string): Promise<RunInsightWeekly> {
        const weekEnd = getNextWeek(weekStart)
        const prevWeekStart = getPrevWeek(weekStart)

        // Current week records
        const records = await this.db
            .select()
            .from(runRecords)
            .where(
                and(
                    eq(runRecords.userId, userId),
                    gte(runRecords.runDate, weekStart),
                    lt(runRecords.runDate, weekEnd)
                )
            )

        // Previous week avg RPE
        const [prevRow] = await this.db
            .select({ avgRpe: sql<number>`avg(${runRecords.rpe})::float` })
            .from(runRecords)
            .where(
                and(
                    eq(runRecords.userId, userId),
                    gte(runRecords.runDate, prevWeekStart),
                    lt(runRecords.runDate, weekStart)
                )
            )

        const recordCount = records.length
        const avgRpe =
            recordCount > 0 ? records.reduce((sum, r) => sum + r.rpe, 0) / recordCount : 0
        const prevAvgRpe = prevRow?.avgRpe ?? null
        const deltaRpeVsLastWeek = prevAvgRpe != null ? avgRpe - prevAvgRpe : null

        const totalDistanceKm = records.reduce((sum, r) => sum + Number(r.distanceKm), 0)
        const avgPaceSecPerKm =
            recordCount > 0
                ? records.reduce((sum, r) => sum + Number(r.avgPaceSecPerKm), 0) / recordCount
                : 0

        const conditionDistribution: Record<ConditionLevel, number> = { good: 0, normal: 0, bad: 0 }
        const painFrequency: Record<string, number> = {}

        for (const r of records) {
            conditionDistribution[r.condition as ConditionLevel]++
            if (r.painAreas) {
                for (const area of r.painAreas) {
                    painFrequency[area] = (painFrequency[area] ?? 0) + 1
                }
            }
        }

        return {
            weekStart,
            recordCount,
            avgRpe: Math.round(avgRpe * 10) / 10,
            deltaRpeVsLastWeek:
                deltaRpeVsLastWeek != null ? Math.round(deltaRpeVsLastWeek * 10) / 10 : null,
            totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
            avgPaceSecPerKm: Math.round(avgPaceSecPerKm),
            conditionDistribution,
            painFrequency
        }
    }
}

function getNextWeek(dateStr: string): string {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
}

function getPrevWeek(dateStr: string): string {
    const d = new Date(dateStr)
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
}
