export type GeoJsonPosition = [number, number, number]

export interface GeoJson {
    type: string
    coordinates: GeoJsonPosition[][] | GeoJsonPosition[] | GeoJsonPosition
}

export interface GeoJsonPoint extends GeoJson {
    type: 'Point'
    coordinates: GeoJsonPosition
}

export interface GeoJsonLineString extends GeoJson {
    type: 'LineString'
    coordinates: GeoJsonPosition[]
}

export interface GeoJsonPolygon extends GeoJson {
    type: 'Polygon'
    coordinates: GeoJsonPosition[][]
}

export interface GeoJsonMultiPolygon {
    type: 'MultiPolygon'
    coordinates: GeoJsonPosition[][][]
}
