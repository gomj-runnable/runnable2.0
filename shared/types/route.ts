import type { SectionAttrSchema } from '#shared/schemas/route.schema'
import type { GeoJsonLineString } from '#shared/types/geojson'

export type SectionAttr = SectionAttrSchema
export type { GeoJsonLineString }

export interface GeoJsonFeature<TGeometry> {
    type: 'Feature'
    properties: Record<string, unknown>
    geometry: TGeometry
}

export type RouteGeoJson = GeoJsonLineString | GeoJsonFeature<GeoJsonLineString>

export interface RouteElevationPoint {
    distanceKm: number
    elevation: number
}

export interface RouteElevationSection {
    label: string
    color: string
    startIndex: number
    endIndex: number
}

export interface RouteElevationProfile {
    points: RouteElevationPoint[]
    sections: RouteElevationSection[]
    distanceKm: number
    minElevation: number
    maxElevation: number
    elevationGain: number
    elevationLoss: number
    highestPoint: RouteElevationPoint
    lowestPoint: RouteElevationPoint
}

export interface SavedRoute {
    routeId: string
    title: string
    description?: string
    highHeight?: number
    lowHeight?: number
    distance?: number
}

export interface SavedSection {
    sectionId: string
    routeId: string
    /** GeoJSON LineString - 경도/위도/고도 */
    geom?: GeoJsonLineString
    attrs?: SectionAttr[]
}
