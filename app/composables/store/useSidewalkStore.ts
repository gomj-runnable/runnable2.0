/**
 * 인도 표시 레이어의 시군구 선택 상태를 관리하는 store composable.
 * 사용자가 선택한 구의 인도 데이터만 로드·렌더링하도록 `useFacilitySideeffect`와 연동한다.
 */

export interface SidewalkDistrict {
    /** 구 이름 (예: '강남구') */
    name: string
    /** 행정구역 코드 */
    code?: string
    /** 해당 구의 인도 피처 수 */
    count: number
}

export const useSidewalkStore = () => {
    /** 구 목록 (index.json에서 로드) */
    const districts = useState<SidewalkDistrict[]>('sidewalk.districts', () => [])
    /** 현재 선택된 구 이름 집합 */
    const selectedDistricts = useState<Set<string>>('sidewalk.selected', () => new Set())
    /** 인도 표시 칩 활성 여부 (FacilityOverlay에서 토글) */
    const isActive = useState('sidewalk.active', () => false)
    /** 로딩 중 여부 */
    const isLoading = useState('sidewalk.loading', () => false)

    /** 구 선택을 토글한다. */
    const toggleDistrict = (name: string) => {
        const next = new Set(selectedDistricts.value)

        if (next.has(name)) {
            next.delete(name)
        } else {
            next.add(name)
        }

        selectedDistricts.value = next
    }

    /** 모든 구 선택을 해제한다. */
    const clearSelection = () => {
        selectedDistricts.value = new Set()
    }

    return {
        districts,
        selectedDistricts,
        isActive,
        isLoading,
        toggleDistrict,
        clearSelection
    }
}
