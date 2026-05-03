import { describe, it, expect } from 'vitest'
import type { SavedRoute } from '#shared/types/route'
import { useExploreFilterStore, FILTER_ALL } from '~/features/explore/model/useExploreFilterStore'

// ─── 헬퍼 ──────────────────────────────────────────────────────────────────
const makeRoute = (sgg: string[], emd: string[] = []): SavedRoute =>
    ({
        routeId: `route-${Math.random()}`,
        title: '테스트',
        description: '',
        isPublic: true,
        sgg,
        emd
    }) as unknown as SavedRoute

// ─── FILTER_ALL 상수 ──────────────────────────────────────────────────────
describe('FILTER_ALL', () => {
    it('"전체" 문자열이다', () => {
        expect(FILTER_ALL).toBe('전체')
    })
})

// ─── 초기 상태 ─────────────────────────────────────────────────────────────
describe('useExploreFilterStore - 초기 상태', () => {
    it('시군구와 읍면동이 모두 FILTER_ALL로 초기화된다', () => {
        const store = useExploreFilterStore()
        expect(store.selectedSigungu.value).toBe(FILTER_ALL)
        expect(store.selectedDong.value).toBe(FILTER_ALL)
    })
})

// ─── setSigungu ────────────────────────────────────────────────────────────
describe('useExploreFilterStore - setSigungu', () => {
    it('시군구를 변경하면 읍면동이 FILTER_ALL로 초기화된다', () => {
        const store = useExploreFilterStore()
        store.selectedDong.value = '역삼동'
        store.setSigungu('강남구')

        expect(store.selectedSigungu.value).toBe('강남구')
        expect(store.selectedDong.value).toBe(FILTER_ALL)
    })
})

// ─── resetFilters ──────────────────────────────────────────────────────────
describe('useExploreFilterStore - resetFilters', () => {
    it('모든 필터를 초기화한다', () => {
        const store = useExploreFilterStore()
        store.selectedSigungu.value = '강남구'
        store.selectedDong.value = '역삼동'
        store.resetFilters()

        expect(store.selectedSigungu.value).toBe(FILTER_ALL)
        expect(store.selectedDong.value).toBe(FILTER_ALL)
    })
})

// ─── applyFilter ───────────────────────────────────────────────────────────
describe('useExploreFilterStore - applyFilter', () => {
    it('FILTER_ALL이면 모든 경로를 반환한다', () => {
        const store = useExploreFilterStore()
        const routes = [makeRoute(['강남구']), makeRoute(['서초구'])]
        const result = store.applyFilter(routes)

        expect(result).toHaveLength(2)
    })

    it('시군구 필터를 적용하면 해당 시군구만 반환한다', () => {
        const store = useExploreFilterStore()
        store.selectedSigungu.value = '강남구'
        const routes = [
            makeRoute(['강남구']),
            makeRoute(['서초구']),
            makeRoute(['강남구', '송파구'])
        ]
        const result = store.applyFilter(routes)

        expect(result).toHaveLength(2)
    })

    it('시군구+읍면동 필터를 적용하면 둘 다 일치하는 경로만 반환한다', () => {
        const store = useExploreFilterStore()
        store.selectedSigungu.value = '강남구'
        store.selectedDong.value = '역삼동'
        const routes = [
            makeRoute(['강남구'], ['역삼동']),
            makeRoute(['강남구'], ['삼성동']),
            makeRoute(['서초구'], ['역삼동'])
        ]
        const result = store.applyFilter(routes)

        expect(result).toHaveLength(1)
    })

    it('sgg 필드가 없는 경로는 필터링 시 제외된다', () => {
        const store = useExploreFilterStore()
        store.selectedSigungu.value = '강남구'
        const routes = [makeRoute([]), makeRoute(['강남구'])]
        const result = store.applyFilter(routes)

        expect(result).toHaveLength(1)
    })
})
