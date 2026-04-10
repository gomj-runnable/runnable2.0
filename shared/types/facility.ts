export type FacilityType = 'crosswalk' | 'fountain' | 'locker' | 'hospital'

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
