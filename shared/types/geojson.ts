import type { Point, LineString, Polygon, MultiPolygon } from 'geojson'

export type GeoJsonPosition = [number, number, number]

export type GeoJson = Point | LineString | Polygon

export type GeoJsonPoint = Point
export type GeoJsonLineString = LineString
export type GeoJsonPolygon = Polygon
export type GeoJsonMultiPolygon = MultiPolygon
