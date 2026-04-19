import type { GeoJsonPosition, GeoJson } from '#shared/types/geojson.ts'

export type NodeType = 'station' | 'sector' | 'floor' | 'spot' | 'facility' | 'move'

export interface BaseAttribute {
    comment?: string
    file_id?: string | null
    file_nm?: string | null
    fly_dir?: string | null
    fly_pos?: string | null
    addr_road?: string | null
    addr_jibun?: string | null
    description?: string | null
}

export interface NodeAttribute extends BaseAttribute {
    geom?: GeoJson | null
}

export interface Resources {
    img?: string | string[] | null
    icon?: string | null
    url?: string | null
    card?: string
    detail?: string
}

export interface Camera {
    id: string
    name: string
    position: GeoJsonPosition
    direction: GeoJsonPosition
    resources?: Resources
}

export interface BaseNode {
    id: string
    name: string
    type: NodeType
    cameras?: Camera[]
    children: BaseNode[]
    position?: GeoJsonPosition
    template?: string | null
    attribute?: NodeAttribute
    resources?: Resources
}

export interface ThemeMapData {
    children: BaseNode[]
}

export interface ThemeMapAttribute extends BaseAttribute {
    geom?: string | null
}

export interface RelatedTheme {
    id: string
    name: string
    description: string
}

export interface ThemeMap {
    id: string
    name: string
    description: string
    attribute: ThemeMapAttribute
    relativeMaps: RelatedTheme[]
    data: ThemeMapData
    createdAt: string
    updatedAt: string
}

/** POI 데이터 (Cesium _createDivPOI 용) */
export interface PoiData {
    poi_id: string
    name: string
    lon: number
    lat: number
    height: number
}
