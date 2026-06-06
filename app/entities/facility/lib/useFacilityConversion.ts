// 시설물 엔티티를 POI 관련 타입(PoiDto, PoiDraftInput)으로 변환하는 유틸리티 모음.
import type { Facility, FacilityType, PoiDraftInput } from '#shared/types/facility'
import { facilityLngLat } from '#shared/types/facility'
import { FacilityTypeEnum } from '#shared/types/facility-type.enum'
import type { PoiDto } from '~/shared/lib/map/usePoiOverlay'

/** POI 현재 위치 검색 대상 유형 */
export const SEARCHABLE_FACILITY_TYPES: FacilityType[] = [
    'crosswalk',
    'fountain',
    'toilet',
    'locker'
]

/** Facility → PoiDto 변환 (geometry 의 대표 좌표 사용) */
export const toPoiDto = (facility: Facility): PoiDto => {
    const coord = facilityLngLat(facility)
    return {
        id: facility.id,
        lon: coord?.[0] ?? 0,
        lat: coord?.[1] ?? 0,
        name: facility.name,
        descript: facility.description ?? ''
    }
}

/**
 * Facility 엔티티 → PoiDraftInput 변환 헬퍼.
 * FacilityType → PoiType 매핑 및 geom 생성을 담당한다.
 * geometry(좌표)가 없으면 변환할 수 없으므로 null 을 반환한다.
 */
export const facilityToPoiDraft = (facility: Facility): PoiDraftInput | null => {
    const enumInstance = FacilityTypeEnum.from(facility.type)
    const poiType = enumInstance?.poiType

    if (!poiType) return null

    const coord = facilityLngLat(facility)
    if (!coord) return null

    return {
        name: facility.name,
        type: poiType,
        geom: {
            type: 'Point',
            coordinates: coord
        }
    }
}
