import { z } from 'zod'
import type { RunRecordDraftInput } from '#shared/types/run-record'

export const conditionLevelSchema = z.enum(['good', 'normal', 'bad'])

export const weatherSnapshotSchema = z.object({
    tempC: z.number(),
    humidity: z.number().min(0).max(100),
    pm10: z.number().nonnegative().optional()
})

export const createRunRecordSchema = z.object({
    routeId: z.string().optional(),
    runDate: z.string().min(1),
    distanceKm: z.number().positive().max(200),
    durationSec: z.number().int().positive(),
    avgPaceSecPerKm: z.number().positive(),
    rpe: z.number().int().min(1).max(10),
    condition: conditionLevelSchema,
    sleepHours: z.number().min(0).max(24).optional(),
    stressLevel: z.number().int().min(1).max(5).optional(),
    painAreas: z.array(z.string().max(50)).max(10).optional(),
    weatherSnapshot: weatherSnapshotSchema.optional(),
    notes: z.string().max(1000).optional()
}) satisfies z.ZodType<RunRecordDraftInput>

export type CreateRunRecordSchema = z.infer<typeof createRunRecordSchema>
