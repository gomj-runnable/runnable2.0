export type NodeType = 'station' | 'sector' | 'floor' | 'spot' | 'facility' | 'move'
export type Position = [number, number, number]

export interface FeatureAttribute {
  부재종류: string
  부재형식: string
  점검연도: number
  상태등급: string
  제원정보: string
}

export interface DamagedFacility {
  순번: string
  기준연도: number
  점검종류: string
  손상종류: string
  손상명: string
  손상수량: number
  추출연도: number
  부재상태: string
  보수방법설명: string
  GIS정보: string
  image: string
}

export interface GeoJsonPolygon {
  type: 'Polygon'
  coordinates: Position[][]
}

export interface NodeAttribute {
  comment?: string
  file_id?: string | null
  file_nm?: string | null
  fly_dir?: string | null
  fly_pos?: string | null
  addr_road?: string | null
  addr_jibun?: string | null
  description?: string | null
  geom?: GeoJsonPolygon | string | null
  featureAttribute?: FeatureAttribute
  damagedFacilities?: DamagedFacility[]
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
  position: Position
  direction: Position
  resources?: Resources
}

export interface BaseNode {
  id: string
  name: string
  type: NodeType
  cameras?: Camera[]
  children: BaseNode[]
  position?: Position
  template?: string | null
  attribute?: NodeAttribute
  resources?: Resources
}

export interface ThemeMapData {
  children: BaseNode[]
}

export interface ThemeMapAttribute {
  comment?: string
  file_id?: string | null
  file_nm?: string | null
  fly_dir?: string | null
  fly_pos?: string | null
  addr_road?: string | null
  addr_jibun?: string | null
  description?: string | null
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
