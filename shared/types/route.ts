import type { Feature } from 'geojson'
import type { SectionAttrSchema } from '#shared/schemas/route.schema'
import type { GeoJsonLineString } from '#shared/types/geojson'
import type { PoiDraftInput } from '#shared/types/facility'

export type SectionAttr = SectionAttrSchema

export type RouteGeoJson = GeoJsonLineString | Feature<GeoJsonLineString, Record<string, unknown>>

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
    /** 경로가 통과하는 서울 시군구 목록 */
    sgg?: string[]
    /** 경로가 통과하는 서울 읍면동 목록 */
    emd?: string[]
    /** 가져오기(fork) 시 원본 경로 ID */
    sourceRouteId?: string
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
    /** 구간에 연결된 POI 목록 */
    pois?: PoiDraftInput[]
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
