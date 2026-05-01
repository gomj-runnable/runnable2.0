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

/**
 * Template Method 기반 라우팅 서비스 추상 클래스.
 *
 * 공통 흐름: 검증 → API 호출 → 응답 파싱 → 고도 보간
 * 서브클래스는 callApi()와 parseCoords()만 구현한다.
 */
export abstract class AbstractRoutingService implements RoutingService {
    abstract isAvailable(): boolean

    /** 외부 라우팅 API를 호출한다. */
    protected abstract callApi(positions: GeoJsonPosition[]): Promise<Response>

    /** API 응답에서 2D 좌표 배열을 추출한다. 빈 배열이면 원본 반환. */
    protected abstract parseCoords(data: unknown): [number, number][]

    /** 에러 발생 시 처리. 기본: throw. 서브클래스가 graceful fallback을 원하면 override. */
    protected onError(positions: GeoJsonPosition[], error: unknown): GeoJsonPosition[] {
        throw error
    }

    /** Template Method — 서브클래스가 override하지 않는다. */
    async optimize(positions: GeoJsonPosition[]): Promise<GeoJsonPosition[]> {
        if (positions.length < 2) return positions

        try {
            const response = await this.callApi(positions)

            if (!response.ok) {
                throw new Error(`Routing API error: ${response.status} ${response.statusText}`)
            }

            const data: unknown = await response.json()
            const coords = this.parseCoords(data)

            if (coords.length === 0) return positions

            return interpolateHeights(positions, coords)
        } catch (error) {
            return this.onError(positions, error)
        }
    }
}
