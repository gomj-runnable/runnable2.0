import { z } from 'zod'
import type { RouteSectionDraftInput } from '#shared/types/route'
import type { PoiDraftInput } from '#shared/types/facility'
import { geoJsonPositionSchema } from './geojson.schema'

export { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'

export const geoJsonPointSchema = z.object({
    type: z.literal('Point'),
    coordinates: z.array(z.number()).min(2).max(3)
})

export const poiSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['HOSPITAL', 'CROSSWALK', 'WATER']),
    geom: geoJsonPointSchema,
    attribute: z.record(z.string(), z.unknown()).optional()
}) satisfies z.ZodType<PoiDraftInput>

export const geoJsonLineStringPositionSchema = geoJsonPositionSchema
export const geoJsonLineStringSchema = z.object({
    type: z.literal('LineString'),
    coordinates: z.array(geoJsonLineStringPositionSchema)
})

export const sectionAttrSchema = z.object({
    seq: z.int(),
    name: z.string().optional(),
    comment: z.string().optional(),
    description: z.string().optional()
})

export const createSectionSchema = z.object({
    routeId: z.string().min(1),
    geom: geoJsonLineStringSchema.optional(),
    attrs: z.array(sectionAttrSchema).optional(),
    pois: z.array(poiSchema).optional()
}) satisfies z.ZodType<RouteSectionDraftInput>

export const createRouteSchema = z.object({
    title: z
        .string()
        .min(1, '경로 제목을 입력해주세요')
        .max(255, '경로 제목은 최대 255자까지 가능합니다'),
    description: z.string().optional(),
    highHeight: z.number().optional(),
    lowHeight: z.number().optional(),
    distance: z.number().nonnegative().optional(),
    sgg: z.array(z.string()).optional(),
    emd: z.array(z.string()).optional(),
    isPublic: z.boolean().optional().default(true)
})

export type RouteClosingMode = 'loop-close' | 'round-trip' | null

export type SectionAttrSchema = z.infer<typeof sectionAttrSchema>
export type CreateSectionSchema = z.infer<typeof createSectionSchema>
export type CreateRouteSchema = z.infer<typeof createRouteSchema>

// Note: RouteDraftBuilder, RouteDraftAssembler, RouteDrawMetricsInput
// have been moved to ~/entities/route/lib/useRouteDraftBuilder.
