import type { SavedRoute } from '#shared/types/route'

/**
 * 탐색 탭의 공유 상태를 관리하는 store composable.
 * 검색 결과·검색어·로딩 상태·선택 경로 ID를 `useState`로 보유한다.
 */
export const useExploreSearchStore = () => {
    /** 검색 결과로 반환된 공개 경로 목록 */
    const searchResults = useState<SavedRoute[]>('explore-search-results', () => [])
    /** 현재 검색 입력값 */
    const searchQuery = useState('explore-search-query', () => '')
    /** 검색 API 호출 중 여부 */
    const isSearching = useState('explore-is-searching', () => false)
    /** 탐색 탭에서 현재 선택된 경로 ID. 선택 없음이면 `null`. */
    const selectedRouteId = useState<string | null>('explore-selected-route', () => null)

    /** 경로를 선택하거나 이미 선택된 경로를 클릭하면 선택을 해제한다. */
    const selectRoute = (routeId: string) => {
        selectedRouteId.value = selectedRouteId.value === routeId ? null : routeId
    }

    return {
        searchResults,
        searchQuery,
        isSearching,
        selectedRouteId,
        selectRoute
    }
}
