import type { SavedRoute } from '#shared/types/route'

/** 필터 미적용 상태를 나타내는 상수 */
export const FILTER_ALL = '전체' as const

/**
 * 탐색 탭의 시군구/읍면동 필터 상태를 관리하는 store composable.
 * 검색 결과에서 sgg/emd 필드 기반으로 경로를 필터링한다.
 */
export const useExploreFilterStore = () => {
    const selectedSigungu = useState<string>('explore-filter-sigungu', () => FILTER_ALL)
    const selectedDong = useState<string>('explore-filter-dong', () => FILTER_ALL)

    /** 시군구 변경 시 읍면동을 초기화한다. */
    const setSigungu = (value: string) => {
        selectedSigungu.value = value
        selectedDong.value = FILTER_ALL
    }

    /** 모든 필터를 초기화한다. */
    const resetFilters = () => {
        selectedSigungu.value = FILTER_ALL
        selectedDong.value = FILTER_ALL
    }

    /** 검색 결과에 시군구/읍면동 필터를 적용한다. */
    const applyFilter = (results: SavedRoute[]): SavedRoute[] => {
        if (selectedSigungu.value === FILTER_ALL) return results

        let filtered = results.filter((r) => r.sgg?.includes(selectedSigungu.value))

        if (selectedDong.value !== FILTER_ALL) {
            filtered = filtered.filter((r) => r.emd?.includes(selectedDong.value))
        }

        return filtered
    }

    return {
        selectedSigungu,
        selectedDong,
        setSigungu,
        resetFilters,
        applyFilter
    }
}
