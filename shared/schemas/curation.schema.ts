import { z } from 'zod'
import type { CurationCollectionDraftInput, CurationRouteDraftInput } from '#shared/types/curation'

export const curationSeasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter'])

export const curationThemeSchema = z.enum([
    'cherry-blossom',
    'autumn-leaves',
    'sunrise',
    'sunset',
    'night-view',
    'shade',
    'riverside'
])

export const createCurationCollectionSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    season: curationSeasonSchema,
    theme: curationThemeSchema,
    validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    coverImageUrl: z.string().url().optional()
}) satisfies z.ZodType<CurationCollectionDraftInput>

export const createCurationRouteSchema = z.object({
    routeId: z.string().min(1),
    recommendedHourLocal: z.number().int().min(0).max(23).optional(),
    photoUrl: z.string().url().optional(),
    note: z.string().max(200).optional(),
    sortOrder: z.number().int().nonnegative()
}) satisfies z.ZodType<CurationRouteDraftInput>

export type CreateCurationCollectionSchema = z.infer<typeof createCurationCollectionSchema>
export type CreateCurationRouteSchema = z.infer<typeof createCurationRouteSchema>
