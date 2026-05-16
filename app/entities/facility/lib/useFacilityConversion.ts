import type { Facility, FacilityType, PoiDraftInput } from '#shared/types/facility'
import { FacilityTypeEnum } from '#shared/types/facility-type.enum'
import type { PoiDto } from '~/shared/lib/map/usePoiOverlay'

/** POI 현재 위치 검색 대상 유형 */
export const SEARCHABLE_FACILITY_TYPES: FacilityType[] = [
    'crosswalk',
    'fountain',
    'toilet',
    'locker'
]

/** Facility → PoiDto 변환 */
export const toPoiDto = (facility: Facility): PoiDto => ({
    id: facility.id,
    lon: facility.lng,
    lat: facility.lat,
    name: facility.name,
    descript: facility.description ?? ''
})

/**
 * Facility 엔티티 → PoiDraftInput 변환 헬퍼.
 * FacilityType → PoiType 매핑 및 geom 생성을 담당한다.
 */
export const facilityToPoiDraft = (facility: Facility): PoiDraftInput | null => {
    const enumInstance = FacilityTypeEnum.from(facility.type)
    const poiType = enumInstance?.poiType

    if (!poiType) return null

    return {
        name: facility.name,
        type: poiType,
        geom: {
            type: 'Point',
            coordinates: [facility.lng, facility.lat]
        }
    }
}
