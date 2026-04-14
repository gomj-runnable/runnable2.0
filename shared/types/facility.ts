import type { GeoJsonPoint } from '#shared/types/geojson'

export type FacilityType = 'crosswalk' | 'fountain' | 'locker' | 'hospital' | 'sidewalk'

/** POI 저장용 타입 (경로 구간에 연결되는 관심지점) */
export type PoiType = 'HOSPITAL' | 'CROSSWALK' | 'WATER'

export interface PoiDraftInput {
    name: string
    description?: string
    type: PoiType
    geom: GeoJsonPoint
    attribute?: Record<string, unknown>
}

export interface Facility {
    id: string
    type: FacilityType
    name: string
    lng: number
    lat: number
    /** 횡단보도 전용: 신호등 유무 */
    hasSignal?: boolean
    /** 횡단보도 전용: 폴리라인 좌표 [lng, lat][] */
    polyline?: [number, number][]
}

export interface FacilityLayerConfig {
    type: FacilityType
    label: string
    icon: string
    color: string
}
