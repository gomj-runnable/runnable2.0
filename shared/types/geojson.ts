import type { Position } from '#shared/types/base.ts'

export interface GeoJsonPoint {
    type: 'Point'
    coordinates: Position
}

export interface GeoJsonPolyline {
    type: 'LineString'
    coordinates: Position[]
}

export interface GeoJsonPolygon {
    type: 'Polygon'
    coordinates: Position[][]
}

export interface GeoJsonMultiPolygon {
    type: 'MultiPolygon'
    coordinates: Position[][][]
}

export type GeoJson = GeoJsonPoint | GeoJsonPolyline | GeoJsonPolygon | GeoJsonMultiPolygon
