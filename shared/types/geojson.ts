// GeoJSON 관련 공용 타입 정의 (Position, Point/LineString/Polygon, GeoFeature)
import type { Point, LineString, Polygon, MultiPolygon } from 'geojson'

export type GeoJsonPosition = [number, number, number]

export type GeoJson = Point | LineString | Polygon

export type GeoJsonPoint = Point
export type GeoJsonLineString = LineString
export type GeoJsonPolygon = Polygon
export type GeoJsonMultiPolygon = MultiPolygon

/** GeoJSON Feature의 공용 타입. 행정경계·날씨 등 여러 sideeffect에서 공통으로 사용한다. */
export type GeoFeature = {
    properties?: Record<string, unknown>
    geometry?: {
        type: string
        coordinates: number[][][] | number[][][][]
    } | null
}
