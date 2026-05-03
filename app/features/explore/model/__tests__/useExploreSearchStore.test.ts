import { describe, it, expect } from 'vitest'
import { useExploreSearchStore } from '~/features/explore/model/useExploreSearchStore'

// ─── 초기 상태 ─────────────────────────────────────────────────────────────
describe('useExploreSearchStore - 초기 상태', () => {
    it('초기값이 올바르다', () => {
        const store = useExploreSearchStore()

        expect(store.searchResults.value).toEqual([])
        expect(store.searchQuery.value).toBe('')
        expect(store.isSearching.value).toBe(false)
        expect(store.selectedRouteId.value).toBeNull()
    })
})

// ─── selectRoute ───────────────────────────────────────────────────────────
describe('useExploreSearchStore - selectRoute', () => {
    it('경로를 선택하면 selectedRouteId가 설정된다', () => {
        const store = useExploreSearchStore()
        store.selectRoute('route-1')

        expect(store.selectedRouteId.value).toBe('route-1')
    })

    it('이미 선택된 경로를 다시 클릭하면 선택이 해제된다', () => {
        const store = useExploreSearchStore()
        store.selectRoute('route-1')
        store.selectRoute('route-1')

        expect(store.selectedRouteId.value).toBeNull()
    })

    it('다른 경로를 선택하면 이전 선택이 교체된다', () => {
        const store = useExploreSearchStore()
        store.selectRoute('route-1')
        store.selectRoute('route-2')

        expect(store.selectedRouteId.value).toBe('route-2')
    })
})
