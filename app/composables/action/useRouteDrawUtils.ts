import type { Cartesian3 } from 'cesium'
import type { DrawActionData } from '~/composables/useWindow'
import type { GeoJsonLineString, RouteGeoJson } from '#shared/types/route'
import type { GeoJsonPosition } from '#shared/types/geojson'
import { SECTION_COLORS } from '#shared/constants/route'

export const getSectionColor = (sectionIndex: number): string =>
    SECTION_COLORS[sectionIndex % SECTION_COLORS.length] ?? SECTION_COLORS[0]

export const cartesianToRouteDrawPosition = (position: Cartesian3): GeoJsonPosition => {
    const cartographic = window.Cesium.Cartographic.fromCartesian(position)

    return [
        window.Cesium.Math.toDegrees(cartographic.longitude),
        window.Cesium.Math.toDegrees(cartographic.latitude),
        cartographic.height
    ]
}

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

export const toCartesianPosition = ([
    longitude,
    latitude,
    height = 0
]: GeoJsonPosition): Cartesian3 => window.Cesium.Cartesian3.fromDegrees(longitude, latitude, height)

export const toCesiumColor = (color: string, alpha = 1) =>
    window.Cesium.Color.fromCssColorString(color).withAlpha(alpha)

export const cartesianToWgs84Coordinate = (position: Cartesian3): GeoJsonPosition => {
    const cartographic = window.Cesium.Cartographic.fromCartesian(position)

    return [
        window.Cesium.Math.toDegrees(cartographic.longitude),
        window.Cesium.Math.toDegrees(cartographic.latitude),
        0
    ]
}

export const toLineStringCoordinate = (
    coordinate: GeoJsonPosition | Cartesian3
): GeoJsonPosition =>
    Array.isArray(coordinate)
        ? [coordinate[0], coordinate[1], coordinate[2] ?? 0]
        : cartesianToWgs84Coordinate(coordinate)

export const isGeoJsonLineString = (value: unknown): value is GeoJsonLineString =>
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'LineString' &&
    'coordinates' in value &&
    Array.isArray(value.coordinates)

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
