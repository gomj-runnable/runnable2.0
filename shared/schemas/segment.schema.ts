import { z } from 'zod'
import type { SegmentDraftInput, SegmentEffortDraftInput } from '#shared/types/segment'

export const createSegmentSchema = z.object({
    name: z.string().min(1, '세그먼트 이름을 입력해주세요').max(100),
    description: z.string().max(500).optional(),
    routeId: z.string().min(1),
    startPositionIndex: z.number().int().nonnegative(),
    endPositionIndex: z.number().int().nonnegative(),
    distanceKm: z.number().positive().max(100),
    elevationGainM: z.number().nonnegative().optional(),
    isPublic: z.boolean().optional().default(true)
}) satisfies z.ZodType<SegmentDraftInput>

export const createEffortSchema = z.object({
    segmentId: z.string().min(1),
    durationSec: z.number().int().positive(),
    paceSecPerKm: z.number().positive()
}) satisfies z.ZodType<SegmentEffortDraftInput>

export type CreateSegmentSchema = z.infer<typeof createSegmentSchema>
export type CreateEffortSchema = z.infer<typeof createEffortSchema>
