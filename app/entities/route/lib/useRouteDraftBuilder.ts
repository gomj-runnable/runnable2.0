// 경로 초안 데이터를 단계적으로 조립하여 서버 저장용 페이로드를 생성하는 Builder 클래스 모음.
import {
    createRouteSchema,
    type CreateRouteSchema,
    type SectionAttrSchema
} from '#shared/schemas/route.schema'
import type { GeoJsonLineString, GeoJsonPosition } from '#shared/types/geojson'
import type { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'

export interface RouteDrawMetricsInput {
    distance?: number | null
    heights?: Array<number | null | undefined> | null
    geoJson?: GeoJsonLineString | null
    /** 마감 모드. round-trip이면 거리 × 2, loop-close이면 거리 + loopCloseDistance */
    closingMode?: RouteClosingModeEnum | null
    /** loop-close 모드에서 출발지-도착지 간 거리 (meters) */
    loopCloseDistance?: number | null
}

/** 그리기 메트릭(거리·고도)에서 최종 경로 필드를 계산하는 Builder. */
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
