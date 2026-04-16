import type { GeoJsonPosition } from '#shared/types/geojson'

/** 라우팅 서비스 공통 인터페이스 */
export interface RoutingService {
  /** 주어진 경로를 보행자 친화적으로 최적화한다 */
  optimize(positions: GeoJsonPosition[]): Promise<GeoJsonPosition[]>
  /** 서비스 사용 가능 여부 (API 키 등) */
  isAvailable(): boolean
}

/** GeoJsonPosition → "lng,lat" 문자열 */
export const toCoordString = (pos: GeoJsonPosition): string => `${pos[0]},${pos[1]}`

/** 원본 positions에서 고도값을 선형 보간하여 새 positions에 적용 */
export const interpolateHeights = (
  original: GeoJsonPosition[],
  optimized: [number, number][]
): GeoJsonPosition[] => {
  if (original.length === 0 || optimized.length === 0) return []

  const totalOriginal = original.length - 1
  const totalOptimized = optimized.length - 1

  return optimized.map(([lng, lat], i): GeoJsonPosition => {
    // 최적화된 좌표의 비율에 해당하는 원본 인덱스를 계산
    const ratio = totalOptimized === 0 ? 0 : i / totalOptimized
    const origIdx = ratio * totalOriginal
    const lower = Math.floor(origIdx)
    const upper = Math.min(Math.ceil(origIdx), totalOriginal)
    const t = origIdx - lower

    const altLower = original[lower]?.[2] ?? 0
    const altUpper = original[upper]?.[2] ?? 0
    const interpolatedAlt = altLower + (altUpper - altLower) * t

    return [lng, lat, interpolatedAlt]
  })
}
