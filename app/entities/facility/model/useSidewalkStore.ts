/**
 * 인도 표시 레이어의 시군구·동 선택 상태를 관리하는 store composable.
 * 사용자가 선택한 동의 인도 데이터만 로드·렌더링하도록 `useSidewalkSideeffect`와 연동한다.
 */

interface SidewalkDong {
    /** 동 이름 (예: '역삼동') */
    name: string
    /** 해당 동의 인도 피처 수 */
    count: number
}

export interface SidewalkDistrict {
    /** 구 이름 (예: '강남구') */
    name: string
    /** 행정구역 코드 */
    code?: string
    /** 해당 구의 전체 인도 피처 수 */
    count: number
    /** 동 목록 */
    dongs: SidewalkDong[]
}

export const useSidewalkStore = () => {
    /** 구 목록 (index.json에서 로드) */
    const districts = useState<SidewalkDistrict[]>('sidewalk.districts', () => [])
    /** 현재 선택된 구 이름. 미선택이면 null */
    const selectedDistrict = useState<string | null>('sidewalk.selected', () => null)
    /** 현재 선택된 동 이름. 미선택이면 null */
    const selectedDong = useState<string | null>('sidewalk.selectedDong', () => null)
    /** 인도 표시 칩 활성 여부 (FacilityOverlay에서 토글) */
    const isActive = useState('sidewalk.active', () => false)
    /** 로딩 중 여부 */
    const isLoading = useState('sidewalk.loading', () => false)

    /** 구를 선택한다. 이미 선택된 구이면 선택 해제한다. */
    const selectDistrict = (name: string | null) => {
        selectedDistrict.value = selectedDistrict.value === name ? null : name
        selectedDong.value = null
    }

    /**
     * locationLabel(예: "서울특별시 강남구 역삼동")에서 districts 목록과 매칭해 구·동을 자동 선택한다.
     * 동 이름까지 매칭되면 동도 선택한다.
     */
    const setDistrictFromLocation = (locationLabel: string) => {
        const matchedGu = districts.value.find((d) => locationLabel.includes(d.name))
        if (matchedGu) {
            selectedDistrict.value = matchedGu.name
            const matchedDong = matchedGu.dongs.find((d) => locationLabel.includes(d.name))
            selectedDong.value = matchedDong ? matchedDong.name : null
        }
    }

    /** 선택을 해제한다. */
    const clearSelection = () => {
        selectedDistrict.value = null
        selectedDong.value = null
    }

    /** 인도 표시 활성 상태를 토글한다. */
    const toggleActive = () => {
        isActive.value = !isActive.value
    }

    return {
        districts,
        selectedDistrict,
        selectedDong,
        isActive,
        isLoading,
        selectDistrict,
        setDistrictFromLocation,
        clearSelection,
        toggleActive
    }
}
