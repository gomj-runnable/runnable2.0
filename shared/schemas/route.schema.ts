import { z } from 'zod'
import type {
    GeoJsonLineString,
    RouteDraftInput,
    RouteSectionDraftInput
} from '#shared/types/route'
import type { PoiDraftInput } from '#shared/types/facility'

export const geoJsonPointSchema = z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()])
})

export const poiSchema: z.ZodType<PoiDraftInput> = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['HOSPITAL', 'CROSSWALK', 'WATER']),
    geom: geoJsonPointSchema,
    attribute: z.record(z.unknown()).optional()
})

export const geoJsonLineStringPositionSchema = z.tuple([z.number(), z.number(), z.number()])
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

export const createSectionSchema: z.ZodType<RouteSectionDraftInput> = z.object({
    routeId: z.string().min(1),
    geom: geoJsonLineStringSchema.optional(),
    attrs: z.array(sectionAttrSchema).optional(),
    pois: z.array(poiSchema).optional()
})

export const createRouteSchema: z.ZodType<RouteDraftInput> = z.object({
    title: z
        .string()
        .min(1, '경로 제목을 입력해주세요')
        .max(255, '경로 제목은 최대 255자까지 가능합니다'),
    description: z.string().optional(),
    highHeight: z.number().optional(),
    lowHeight: z.number().optional(),
    distance: z.number().nonnegative().optional()
})

export type RouteClosingMode = 'loop-close' | 'round-trip' | null

export interface RouteDrawMetricsInput {
    distance?: number | null
    heights?: Array<number | null | undefined> | null
    geoJson?: GeoJsonLineString | null
    /** 마감 모드. round-trip이면 거리 × 2, loop-close이면 거리 + loopCloseDistance */
    closingMode?: RouteClosingMode
    /** loop-close 모드에서 출발지-도착지 간 거리 (meters) */
    loopCloseDistance?: number | null
}

export class RouteDraftBuilder {
    constructor(private readonly drawMetrics?: RouteDrawMetricsInput | null) {}

    getDistance() {
        const base = typeof this.drawMetrics?.distance === 'number'
            ? this.drawMetrics.distance
            : undefined

        if (base === undefined) return undefined

        const mode = this.drawMetrics?.closingMode
        if (mode === 'round-trip') {
            return base * 2
        }
        if (mode === 'loop-close') {
            const extra = typeof this.drawMetrics?.loopCloseDistance === 'number'
                ? this.drawMetrics.loopCloseDistance
                : 0
            return base + extra
        }

        return base
    }

    getHeights() {
        const heights = (this.drawMetrics?.heights ?? []).filter(
            (height): height is number => typeof height === 'number' && Number.isFinite(height)
        )

        if (heights.length > 0) {
            return {
                highHeight: Math.max(...heights),
                lowHeight: Math.min(...heights)
            }
        }

        const geoJsonHeights = (this.drawMetrics?.geoJson?.coordinates ?? [])
            .map((coordinate) => coordinate[2])
            .filter((height): height is number => Number.isFinite(height))

        if (geoJsonHeights.length === 0) {
            return {
                highHeight: undefined,
                lowHeight: undefined
            }
        }

        return {
            highHeight: Math.max(...geoJsonHeights),
            lowHeight: Math.min(...geoJsonHeights)
        }
    }

    toRoute(input: { title: string; description?: string | null }) {
        const { highHeight, lowHeight } = this.getHeights()

        return createRouteSchema.parse({
            title: input.title,
            description: input.description || undefined,
            distance: this.getDistance(),
            highHeight,
            lowHeight
        })
    }
}

export type SectionAttrSchema = z.infer<typeof sectionAttrSchema>
export type CreateSectionSchema = z.infer<typeof createSectionSchema>
export type CreateRouteSchema = z.infer<typeof createRouteSchema>
