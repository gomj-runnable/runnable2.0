import { z } from 'zod'
import {
    ROUTE_OPTIMIZATION_MODES,
    isServerRoutedMode,
    type RouteOptimizationMode,
    type RouteOptimizeResponse
} from '#shared/types/route-optimization'
import type { GeoJsonPosition } from '#shared/types/geojson'
import { geoJsonPositionSchema } from './geojson.schema'

const modeKeys = Object.keys(ROUTE_OPTIMIZATION_MODES) as [string, ...string[]]

export const routeOptimizationModeSchema = z.enum(modeKeys)

export const routeOptimizeRequestSchema = z.object({
    positions: z.array(geoJsonPositionSchema).min(2).max(100),
    mode: routeOptimizationModeSchema
})

export const routeOptimizeResponseSchema = z.object({
    positions: z.array(geoJsonPositionSchema),
    mode: routeOptimizationModeSchema,
    optimized: z.boolean(),
    message: z.string().optional()
})

export type RouteOptimizeRequestSchema = z.infer<typeof routeOptimizeRequestSchema>
export type RouteOptimizeResponseSchema = z.infer<typeof routeOptimizeResponseSchema>

/** 경로 최적화 요청 캡슐화 */
export class RouteOptimizeRequestBody {
    readonly positions: GeoJsonPosition[]
    readonly mode: RouteOptimizationMode

    private constructor(positions: GeoJsonPosition[], mode: RouteOptimizationMode) {
        this.positions = positions
        this.mode = mode
    }

    static fromRaw(raw: unknown): RouteOptimizeRequestBody {
        const parsed = routeOptimizeRequestSchema.parse(raw)
        return new RouteOptimizeRequestBody(
            parsed.positions as GeoJsonPosition[],
            parsed.mode as RouteOptimizationMode
        )
    }

    isServerRouted(): boolean {
        return isServerRoutedMode(this.mode)
    }

    toBody(): { positions: GeoJsonPosition[]; mode: RouteOptimizationMode } {
        return { positions: this.positions, mode: this.mode }
    }
}

/** 경로 최적화 응답 캡슐화 */
export class RouteOptimizeResponseBody implements RouteOptimizeResponse {
    readonly positions: GeoJsonPosition[]
    readonly mode: RouteOptimizationMode
    readonly optimized: boolean
    readonly message?: string

    private constructor(
        positions: GeoJsonPosition[],
        mode: RouteOptimizationMode,
        optimized: boolean,
        message?: string
    ) {
        this.positions = positions
        this.mode = mode
        this.optimized = optimized
        this.message = message
    }

    static success(
        positions: GeoJsonPosition[],
        mode: RouteOptimizationMode
    ): RouteOptimizeResponseBody {
        return new RouteOptimizeResponseBody(positions, mode, true)
    }

    static fallback(
        positions: GeoJsonPosition[],
        mode: RouteOptimizationMode,
        message?: string
    ): RouteOptimizeResponseBody {
        return new RouteOptimizeResponseBody(positions, mode, false, message)
    }

    isSuccess(): boolean {
        return this.optimized
    }
}
