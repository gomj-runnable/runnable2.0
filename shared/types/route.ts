import type { SectionAttrSchema } from '#shared/schemas/route.schema'

export type SectionAttr = SectionAttrSchema
export type GeoJsonLineStringPosition = [number, number, number]

export interface GeoJsonLineString {
    type: 'LineString'
    coordinates: GeoJsonLineStringPosition[]
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
    /** GeoJSON LineString - 경도/위도/고도(현재는 0 고정) */
    geom?: GeoJsonLineString
    attrs?: SectionAttr[]
}
