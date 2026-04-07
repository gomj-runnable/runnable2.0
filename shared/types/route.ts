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
