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

export interface RouteBase {
    title: string
    description?: string
    highHeight?: number
    lowHeight?: number
    distance?: number
    isPublic?: boolean
}

export type RouteDraftInput = RouteBase

export interface SavedRoute extends RouteBase {
    routeId: string
    userId?: string
    createdAt?: string
    authorName?: string
}

export interface RouteSectionBase {
    /** GeoJSON LineString - 경도/위도/고도 */
    geom?: GeoJsonLineString
    attrs?: SectionAttr[]
}

export interface RouteSectionDraftInput extends RouteSectionBase {
    routeId: string
}

export interface SavedSection extends RouteSectionBase {
    sectionId: string
    routeId: string
}

export interface RouteSectionCreateInput extends RouteSectionBase {
    /** GeoJSON LineString - 경도/위도/고도 */
    routeId?: never
}
