// 시설물(Facility) 및 POI 관련 타입 정의
import type { GeoJsonPoint } from '#shared/types/geojson'

/** 지도에 표시되는 시설물 종류 */
export type FacilityType = 'crosswalk' | 'fountain' | 'locker' | 'hospital' | 'sidewalk' | 'toilet'

/** POI 저장용 타입 (경로 구간에 연결되는 관심지점) */
export type PoiType = 'HOSPITAL' | 'CROSSWALK' | 'WATER'

/** POI 생성 입력 (DraftInput) */
export interface PoiDraftInput {
    name: string
    description?: string
    type: PoiType
    geom: GeoJsonPoint
    attribute?: Record<string, unknown>
}

/** 저장된 시설물 엔티티 (DB 조회 결과) */
export interface Facility {
    id: string
    type: FacilityType
    name: string
    description?: string
    lng: number
    lat: number
    /** 영업/개방 시간 */
    hours?: string
    /** 전화번호 */
    tel?: string
    /** TODO: adminId 리팩토링 시 수정. 서버 기본 데이터는 '9999' */
    userId?: string
    /** 횡단보도 전용: 신호등 유무 */
    hasSignal?: boolean
    /** 횡단보도 전용: 폴리라인 좌표 [lng, lat][] */
    polyline?: [number, number][]
}

/** 시설물 레이어 렌더링 설정 (아이콘·색상 포함) */
export interface FacilityLayerConfig {
    type: FacilityType
    label: string
    icon: string
    color: string
}
