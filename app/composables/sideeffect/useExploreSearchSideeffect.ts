import type { SavedRoute, SavedSection } from '#shared/types/route'
import { useExploreFilterStore } from '~/composables/store/useExploreFilterStore'
import { useExploreSearchStore } from '~/composables/store/useExploreSearchStore'

/**
 * 탐색 탭에서 공개 경로를 검색하고 결과를 관리하는 sideeffect composable.
 * 상태는 `useExploreSearchStore`에 위임하고, 이 composable은 API 통신만 담당한다.
 */
export const useExploreSearchSideeffect = () => {
    const store = useExploreSearchStore()
    const filter = useExploreFilterStore()

    /** 시군구/읍면동 필터가 적용된 검색 결과 */
    const filteredResults = computed(() => filter.applyFilter(store.searchResults.value))

    /**
     * 공개 경로를 검색하여 `searchResults`를 갱신한다.
     * 쿼리가 없거나 빈 문자열이면 전체 목록을 반환한다.
     */
    const search = async (query?: string) => {
        store.isSearching.value = true
        try {
            const params = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
            store.searchResults.value = await $fetch<SavedRoute[]>(`/api/routes/search${params}`)
        } catch {
            store.searchResults.value = []
        } finally {
            store.isSearching.value = false
        }
    }

    /** 특정 경로의 구간 목록을 서버에서 가져온다. */
    const fetchSections = async (routeId: string): Promise<SavedSection[]> => {
        return $fetch<SavedSection[]>(`/api/routes/${routeId}/sections`)
    }

    return {
        ...store,
        filteredResults,
        filter,
        search,
        fetchSections
    }
}
