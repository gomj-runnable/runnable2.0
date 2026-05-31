// 테마맵 트리 구조 타입 정의 (노드·카메라·속성·ThemeMap 루트)
import type { GeoJsonPosition, GeoJson } from '#shared/types/geojson.ts'

export type NodeType = 'station' | 'sector' | 'floor' | 'spot' | 'facility' | 'move'

/** 노드·테마맵 공통 속성 베이스 */
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

/** 노드에 GeoJSON geom을 추가한 속성 */
export interface NodeAttribute extends BaseAttribute {
    geom?: GeoJson | null
}

/** 노드에 연결된 미디어·URL 리소스 */
export interface Resources {
    img?: string | string[] | null
    icon?: string | null
    url?: string | null
    card?: string
    detail?: string
}

/** 테마맵 노드에 연결된 카메라 시점 정보 */
export interface Camera {
    id: string
    name: string
    position: GeoJsonPosition
    direction: GeoJsonPosition
    resources?: Resources
}

/** 테마맵 트리의 재귀 노드 구조 */
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

/** 테마맵 데이터 루트 (최상위 노드 배열) */
export interface ThemeMapData {
    children: BaseNode[]
}

/** 테마맵 자체 속성 (BaseAttribute + geom 문자열) */
export interface ThemeMapAttribute extends BaseAttribute {
    geom?: string | null
}

/** 연관 테마맵 요약 정보 */
export interface RelatedTheme {
    id: string
    name: string
    description: string
}

/** 테마맵 전체 응답 구조 (API 루트 타입) */
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
