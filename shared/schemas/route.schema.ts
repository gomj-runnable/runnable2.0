import { z } from 'zod'
import type { RouteDraftInput, RouteSectionDraftInput } from '#shared/types/route'
import type { GeoJsonLineString, GeoJsonPosition } from '#shared/types/geojson'
import type { PoiDraftInput } from '#shared/types/facility'
import type { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'

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

export interface RouteDrawMetricsInput {
    distance?: number | null
    heights?: Array<number | null | undefined> | null
    geoJson?: GeoJsonLineString | null
    /** 마감 모드. round-trip이면 거리 × 2, loop-close이면 거리 + loopCloseDistance */
    closingMode?: RouteClosingModeEnum | null
    /** loop-close 모드에서 출발지-도착지 간 거리 (meters) */
    loopCloseDistance?: number | null
}

export class RouteDraftBuilder {
    constructor(private readonly drawMetrics?: RouteDrawMetricsInput | null) {}

    getDistance() {
        const base =
            typeof this.drawMetrics?.distance === 'number' ? this.drawMetrics.distance : undefined

        if (base === undefined) return undefined

        const mode = this.drawMetrics?.closingMode
        if (mode?.isRoundTrip) {
            return base * 2
        }
        if (mode?.isLoopClose) {
            const extra =
                typeof this.drawMetrics?.loopCloseDistance === 'number'
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

type PoiDraftEntry = {
    name: string
    type: string
    geom: { type: 'Point'; coordinates: [number, number, number?] }
}

/**
 * 경로 초안의 다단계 조립을 캡슐화하는 Builder.
 * positions → metrics → sections → pois 순서로 조립하고
 * build()로 최종 결과를 반환한다.
 */
export class RouteDraftAssembler {
    private _positions: GeoJsonPosition[] | null = null
    private _drawMetrics: RouteDrawMetricsInput | null = null
    private _sectionAttrs: SectionAttrSchema[] = []
    private _pois: PoiDraftEntry[] = []
    private _closingMode: RouteClosingModeEnum | null = null

    /** 경로 좌표를 설정한다. */
    withPositions(positions: GeoJsonPosition[]): this {
        this._positions = positions
        return this
    }

    /** 그리기 메트릭(거리, 고도 등)을 설정한다. */
    withDrawMetrics(metrics: RouteDrawMetricsInput): this {
        this._drawMetrics = metrics
        return this
    }

    /** 구간 속성 배열을 설정한다. */
    withSectionAttrs(attrs: SectionAttrSchema[]): this {
        this._sectionAttrs = attrs
        return this
    }

    /** POI 목록을 설정한다. */
    withPois(pois: PoiDraftEntry[]): this {
        this._pois = pois
        return this
    }

    /** 마감 모드를 설정한다. */
    withClosingMode(mode: RouteClosingModeEnum | null): this {
        this._closingMode = mode
        return this
    }

    /** 설정된 positions가 있는지 확인한다. */
    get hasPositions(): boolean {
        return this._positions !== null && this._positions.length > 0
    }

    /** 설정된 positions를 반환한다. */
    get positions(): GeoJsonPosition[] | null {
        return this._positions
    }

    /** 모든 상태를 초기값으로 리셋한다. */
    reset(): this {
        this._positions = null
        this._drawMetrics = null
        this._sectionAttrs = []
        this._pois = []
        this._closingMode = null
        return this
    }

    /**
     * 조립된 데이터로 경로 생성 스키마에 맞는 결과를 빌드한다.
     * drawMetrics가 있으면 RouteDraftBuilder를 통해 거리·고도를 계산한다.
     */
    build(input: { title: string; description?: string | null }): {
        route: CreateRouteSchema
        positions: GeoJsonPosition[] | null
        sectionAttrs: SectionAttrSchema[]
        pois: PoiDraftEntry[]
        closingMode: RouteClosingModeEnum | null
    } {
        const metricsWithClosing: RouteDrawMetricsInput | null = this._drawMetrics
            ? { ...this._drawMetrics, closingMode: this._closingMode }
            : null
        const routeBuilder = new RouteDraftBuilder(metricsWithClosing)
        return {
            route: routeBuilder.toRoute(input),
            positions: this._positions,
            sectionAttrs: this._sectionAttrs,
            pois: this._pois,
            closingMode: this._closingMode
        }
    }
}
