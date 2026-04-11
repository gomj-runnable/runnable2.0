import type { Cartesian3 } from 'cesium'
import type { DrawActionData } from '~/composables/useWindow'
import type { GeoJsonLineString, RouteGeoJson } from '#shared/types/route'
import type { GeoJsonPosition } from '#shared/types/geojson'
import { SECTION_COLORS } from '#shared/constants/route'

/**
 * 구간 인덱스에 대응하는 색상 문자열을 반환한다.
 * 인덱스가 색상 배열 길이를 초과하면 순환(mod)하여 선택한다.
 *
 * @param sectionIndex - 0-based 구간 인덱스
 * @returns CSS 색상 문자열
 */
export const getSectionColor = (sectionIndex: number): string =>
    SECTION_COLORS[sectionIndex % SECTION_COLORS.length] ?? SECTION_COLORS[0]

/**
 * Cesium Cartesian3 좌표를 GeoJSON Position(경도·위도·고도) 배열로 변환한다.
 * `window.Cesium`을 직접 사용하므로 브라우저 환경에서만 호출한다.
 *
 * @param position - Cesium 내부 3D 좌표
 * @returns `[longitude, latitude, height]` 형태의 WGS84 좌표 배열
 */
export const cartesianToRouteDrawPosition = (position: Cartesian3): GeoJsonPosition => {
    const cartographic = window.Cesium.Cartographic.fromCartesian(position)

    return [
        window.Cesium.Math.toDegrees(cartographic.longitude),
        window.Cesium.Math.toDegrees(cartographic.latitude),
        cartographic.height
    ]
}

/**
 * 드로잉 결과에서 GeoJSON Position 배열을 정규화하여 반환한다.
 * `wgs84Array`가 있으면 우선 사용하고, 없으면 Cartesian3 `positions`를 변환한다.
 *
 * @param data - Cesium 드로잉 helper가 반환한 측정값
 * @returns 정규화된 `[longitude, latitude, height]` 배열. 데이터가 없으면 빈 배열.
 */
export const normalizeDrawPositions = (data?: DrawActionData): GeoJsonPosition[] => {
    if (!data) {
        return []
    }

    if (Array.isArray(data.wgs84Array) && data.wgs84Array.length > 0) {
        return data.wgs84Array.map((coordinate, index) => [
            coordinate[0],
            coordinate[1],
            coordinate[2] ?? data.heights?.[index] ?? 0
        ])
    }

    if (!Array.isArray(data.positions)) {
        return []
    }

    return data.positions.map(cartesianToRouteDrawPosition)
}

/**
 * GeoJSON Position을 Cesium Cartesian3 좌표로 변환한다.
 *
 * @param position - `[longitude, latitude, height?]` 형태의 WGS84 좌표
 * @returns Cesium 내부 3D 좌표
 */
export const toCartesianPosition = ([
    longitude,
    latitude,
    height = 0
]: GeoJsonPosition): Cartesian3 => window.Cesium.Cartesian3.fromDegrees(longitude, latitude, height)

/**
 * CSS 색상 문자열과 알파값을 Cesium Color 객체로 변환한다.
 *
 * @param color - CSS 색상 문자열 (예: `'#FF0000'`, `'rgba(255,0,0,1)'`)
 * @param alpha - 불투명도 (0~1, 기본값 1)
 * @returns 알파가 적용된 Cesium Color 객체
 */
export const toCesiumColor = (color: string, alpha = 1) =>
    window.Cesium.Color.fromCssColorString(color).withAlpha(alpha)

/**
 * Cesium Cartesian3 좌표를 고도 0으로 평탄화된 WGS84 좌표로 변환한다.
 * 고도 정보가 불필요한 GeoJSON 직렬화에 사용한다.
 *
 * @param position - Cesium 내부 3D 좌표
 * @returns `[longitude, latitude, 0]` 형태의 WGS84 좌표 배열
 */
export const cartesianToWgs84Coordinate = (position: Cartesian3): GeoJsonPosition => {
    const cartographic = window.Cesium.Cartographic.fromCartesian(position)

    return [
        window.Cesium.Math.toDegrees(cartographic.longitude),
        window.Cesium.Math.toDegrees(cartographic.latitude),
        0
    ]
}

/**
 * GeoJSON Position 또는 Cartesian3를 LineString 좌표(`[lng, lat, height]`)로 정규화한다.
 * Cartesian3 입력은 `cartesianToWgs84Coordinate`를 통해 변환된다.
 *
 * @param coordinate - GeoJSON Position 배열 또는 Cesium Cartesian3 좌표
 * @returns `[longitude, latitude, height]` 형태의 GeoJSON Position
 */
export const toLineStringCoordinate = (
    coordinate: GeoJsonPosition | Cartesian3
): GeoJsonPosition =>
    Array.isArray(coordinate)
        ? [coordinate[0], coordinate[1], coordinate[2] ?? 0]
        : cartesianToWgs84Coordinate(coordinate)

/**
 * 지도 위에 경로 포인트 마커 엔티티를 추가한다.
 * 흰색 외곽선이 있는 원형 포인트로 렌더링되며 깊이 테스트를 비활성화해 항상 표시된다.
 *
 * @param viewer - Cesium viewer (또는 entities.add를 가진 객체)
 * @param position - 마커를 표시할 WGS84 좌표
 * @param color - 마커 채우기 색상 (CSS 문자열)
 * @returns 추가된 Cesium Entity
 */
export const addRoutePointEntity = (
    viewer: { entities: { add(options: unknown): unknown } },
    position: GeoJsonPosition,
    color: string
) =>
    viewer.entities.add({
        position: toCartesianPosition(position),
        point: {
            pixelSize: 10,
            color: toCesiumColor(color, 0.95),
            outlineColor: window.Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
    })

/**
 * 값이 GeoJSON LineString 형식인지 타입 가드로 확인한다.
 *
 * @param value - 검사할 임의의 값
 * @returns `true`이면 `GeoJsonLineString` 타입으로 좁혀진다.
 */
export const isGeoJsonLineString = (value: unknown): value is GeoJsonLineString =>
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'LineString' &&
    'coordinates' in value &&
    Array.isArray(value.coordinates)

/**
 * RouteGeoJson(LineString 또는 Feature)에서 LineString geometry를 추출한다.
 * Feature 형식이면 `.geometry`를 확인하고, LineString이 아니면 `undefined`를 반환한다.
 *
 * @param geoJson - 추출 대상 RouteGeoJson 값
 * @returns LineString geometry 또는 `undefined`
 */
export const extractLineStringGeometry = (
    geoJson?: RouteGeoJson
): GeoJsonLineString | undefined => {
    if (!geoJson) {
        return undefined
    }

    if (isGeoJsonLineString(geoJson)) {
        return geoJson
    }

    const geometry = 'geometry' in geoJson ? geoJson.geometry : undefined

    return isGeoJsonLineString(geometry) ? geometry : undefined
}

/**
 * LineString geometry의 좌표를 드로잉용 GeoJsonPosition 배열로 변환한다.
 * 첫 좌표와 마지막 좌표가 동일하면(닫힌 링) 마지막 포인트를 제거한다.
 *
 * @param geom - LineString GeoJSON geometry
 * @returns 드로잉에 사용할 WGS84 좌표 배열. `geom`이 없으면 빈 배열.
 */
export const geomToRouteDrawPositions = (geom?: GeoJsonLineString): GeoJsonPosition[] => {
    if (!geom) {
        return []
    }

    let coordinates = geom.coordinates

    if (coordinates.length > 1) {
        const first = coordinates[0]
        const last = coordinates[coordinates.length - 1]

        if (first && last && first[0] === last[0] && first[1] === last[1]) {
            coordinates = coordinates.slice(0, -1)
        }
    }

    return coordinates.map(([longitude, latitude, height]) => [longitude, latitude, height])
}
