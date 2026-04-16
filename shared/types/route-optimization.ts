import type { GeoJsonPosition } from './geojson'

/** 경로 최적화 모드 정의 */
export interface RouteOptimizationModeDefinition {
  key: string
  label: string
  requiresServer: boolean
}

/** 모드 레지스트리: 새 모드 추가 시 여기에 항목만 추가 */
export const ROUTE_OPTIMIZATION_MODES = {
  NONE: { key: 'NONE', label: '없음', requiresServer: false },
  TMAP: { key: 'TMAP', label: 'TMap 보행자', requiresServer: true },
  OSRM: { key: 'OSRM', label: 'OSRM 보행자', requiresServer: true },
  'BUILDING-AVOID': { key: 'BUILDING-AVOID', label: '건물 회피', requiresServer: false },
} as const satisfies Record<string, RouteOptimizationModeDefinition>

/** 경로 최적화 모드 (레지스트리에서 자동 도출) */
export type RouteOptimizationMode = keyof typeof ROUTE_OPTIMIZATION_MODES

/** 서버 라우팅이 필요한 모드인지 판별 */
export const isServerRoutedMode = (mode: RouteOptimizationMode): boolean =>
  ROUTE_OPTIMIZATION_MODES[mode].requiresServer

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
