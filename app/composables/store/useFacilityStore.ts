import type { Facility, FacilityType, FacilityLayerConfig } from '#shared/types/facility'
import { EnumBase } from '#shared/types/enum-base'
import { FacilityTypeEnum } from '#shared/types/facility-type.enum'

/** 시설물 칩 — FacilityTypeEnum에서 자동 도출 */
export const FACILITY_LAYERS: FacilityLayerConfig[] =
    EnumBase.values<FacilityTypeEnum>(FacilityTypeEnum).map((e) => e.toLayerConfig())

/**
 * 시설물 데이터와 활성 유형 상태를 관리하는 store composable.
 * 표시할 시설물 유형을 토글하고 `useFacilitySideeffect`가 이를 구독하여 지도를 동기화한다.
 */
export const useFacilityStore = () => {
    /** 서버에서 불러온 전체 시설물 목록 */
    const facilities = useState<Facility[]>('facility.data', () => [])
    /** 현재 지도에 표시 중인 시설물 유형 집합 */
    const activeTypes = useState<Set<FacilityType>>('facility.activeTypes', () => new Set())
    /** 시설물 데이터 로딩 중 여부 */
    const isLoading = useState<boolean>('facility.isLoading', () => false)
    /** 현재 위치 기반 POI 검색 진행 중 여부 */
    const isSearching = useState<boolean>('facility.isSearching', () => false)

    /**
     * 특정 유형이 현재 활성 상태인지 확인한다.
     *
     * @param type - 확인할 시설물 유형
     * @returns 활성이면 `true`
     */
    const isTypeActive = (type: FacilityType) => activeTypes.value.has(type)

    /**
     * 특정 시설물 유형의 표시 상태를 토글한다.
     * 활성이면 비활성으로, 비활성이면 활성으로 전환한다.
     *
     * @param type - 토글할 시설물 유형
     */
    const toggleType = (type: FacilityType) => {
        const next = new Set(activeTypes.value)

        if (next.has(type)) {
            next.delete(type)
        } else {
            next.add(type)
        }

        activeTypes.value = next
    }

    /**
     * 특정 유형의 시설물만 필터링하여 반환한다.
     *
     * @param type - 필터링할 시설물 유형
     * @returns 해당 유형의 시설물 배열
     */
    const facilitiesByType = (type: FacilityType) => facilities.value.filter((f) => f.type === type)

    return {
        facilities,
        activeTypes,
        isLoading,
        isSearching,
        isTypeActive,
        toggleType,
        facilitiesByType
    }
}
