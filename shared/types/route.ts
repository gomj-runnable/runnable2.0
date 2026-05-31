// 경로(Route)·구간(Section) 타입 정의 — Base/DraftInput/Saved 계층
import type { Feature } from 'geojson'
import type { SectionAttrSchema } from '#shared/schemas/route.schema'
import type { GeoJsonLineString } from '#shared/types/geojson'
import type { PoiDraftInput } from '#shared/types/facility'

export type SectionAttr = SectionAttrSchema

export type RouteGeoJson = GeoJsonLineString | Feature<GeoJsonLineString, Record<string, unknown>>

/** 고도 프로파일의 단일 포인트 (거리·고도) */
export interface RouteElevationPoint {
    distanceKm: number
    elevation: number
}

/** 경사도 색상 구간 (시작~끝 인덱스 + 색상 레이블) */
export interface RouteElevationSection {
    label: string
    color: string
    startIndex: number
    endIndex: number
}

/** 경로 전체 고도 프로파일 집계 */
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

/** 경로 공통 필드 베이스 (DraftInput·SavedRoute 공유) */
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

/** 저장된 경로 엔티티 (routeId·작성자 등 포함) */
export interface SavedRoute extends RouteBase {
    routeId: string
    userId?: string
    createdAt?: string
    authorName?: string
    viewCount?: number
    likeCount?: number
}

/** 경로 구간 공통 필드 베이스 */
export interface RouteSectionBase {
    /** GeoJSON LineString - 경도/위도/고도 */
    geom?: GeoJsonLineString
    attrs?: SectionAttr[]
    /** 구간에 연결된 POI 목록 */
    pois?: PoiDraftInput[]
}

/** 구간 생성 입력 (routeId 포함) */
export interface RouteSectionDraftInput extends RouteSectionBase {
    routeId: string
}

/** 저장된 구간 엔티티 (sectionId 포함) */
export interface SavedSection extends RouteSectionBase {
    sectionId: string
    routeId: string
}

export interface RouteSectionCreateInput extends RouteSectionBase {
    /** GeoJSON LineString - 경도/위도/고도 */
    routeId?: never
}
