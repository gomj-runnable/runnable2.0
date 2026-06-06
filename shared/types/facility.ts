// 시설물(Facility) 및 POI 관련 타입 정의
import type { GeoJsonPoint, GeoJsonLineString } from '#shared/types/geojson'

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

/** 시설 가변 속성 (facilitiesAttribute, EAV) — 운영시간·연락처·신호등 유무 등 */
export interface FacilityAttribute {
    name: string
    /** 원시 타입 힌트: 'string' | 'number' | 'boolean' */
    type: string
    value: string
}

/** 시설 외부 참조 링크 (facilitiesReference) */
export interface FacilityReference {
    name: string
    url: string
}

/** 시설 위치/형상 — 점(Point) 또는 선형(LineString: 횡단보도·인도) */
export type FacilityGeometry = GeoJsonPoint | GeoJsonLineString

/** 저장된 시설물 엔티티 (DB 조회 결과) */
export interface Facility {
    id: string
    type: FacilityType
    name: string
    description?: string
    /**
     * GeoJSON geometry — Point 또는 LineString.
     * PostGIS geom 컬럼(Postgres 전용)에서 도출되며, PGlite(dev/test)에선 제공되지 않을 수 있다.
     */
    geometry?: FacilityGeometry
    /** 가변 속성 (운영시간/연락처/신호등 등) */
    attributes: FacilityAttribute[]
    /** 외부 참조 링크 */
    references: FacilityReference[]
}

/** 시설물 레이어 렌더링 설정 (아이콘·색상 포함) */
export interface FacilityLayerConfig {
    type: FacilityType
    label: string
    icon: string
    color: string
}

/** Point/LineString 의 대표 좌표 [lng, lat] 추출 (LineString 은 첫 점). geometry 없으면 null */
export function facilityLngLat(facility: Facility): [number, number] | null {
    const geometry = facility.geometry
    if (!geometry) return null
    const first = geometry.type === 'Point' ? geometry.coordinates : geometry.coordinates[0]
    if (!first || first[0] === undefined || first[1] === undefined) return null
    return [first[0], first[1]]
}

/** 횡단보도/인도 선형 좌표 [[lng, lat], ...] 추출 (LineString 이 아니면 null) */
export function facilityPolyline(facility: Facility): [number, number][] | null {
    const geometry = facility.geometry
    if (!geometry || geometry.type !== 'LineString') return null
    return geometry.coordinates.map((c) => [c[0]!, c[1]!])
}

/** 속성 값 조회 (없으면 undefined) */
export function facilityAttr(facility: Facility, name: string): string | undefined {
    return facility.attributes.find((a) => a.name === name)?.value
}

/** boolean 속성 조회 ('true' 문자열만 true) */
export function facilityAttrBool(facility: Facility, name: string): boolean {
    return facilityAttr(facility, name) === 'true'
}
