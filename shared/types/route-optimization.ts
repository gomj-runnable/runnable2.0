import type { GeoJsonPosition } from './geojson'
import { EnumBase } from './enum-base'
import { RouteOptimizationModeEnum } from './route-optimization-mode.enum'

/** 경로 최적화 모드 정의 */
export interface RouteOptimizationModeDefinition {
  key: string
  label: string
  requiresServer: boolean
}

/** 모드 레지스트리: enum class에서 자동 도출 */
export const ROUTE_OPTIMIZATION_MODES = Object.fromEntries(
  EnumBase.values<RouteOptimizationModeEnum>(RouteOptimizationModeEnum)
    .map((e) => [e.key, { key: e.key, label: e.label, requiresServer: e.requiresServer }])
) as Record<string, RouteOptimizationModeDefinition>

/** 경로 최적화 모드 */
export type RouteOptimizationMode = 'NONE' | 'TMAP' | 'OSRM' | 'BUILDING-AVOID'

/** 서버 라우팅이 필요한 모드인지 판별 */
export const isServerRoutedMode = (mode: RouteOptimizationMode): boolean =>
  RouteOptimizationModeEnum.from(mode).isServerRouted

/** 경로 최적화 요청 */
export interface RouteOptimizeRequest {
  positions: GeoJsonPosition[]
  mode: RouteOptimizationMode
}

/** 경로 최적화 응답 */
export interface RouteOptimizeResponse {
  positions: GeoJsonPosition[]
  mode: RouteOptimizationMode
  optimized: boolean
  message?: string
}
