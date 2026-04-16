import type { RouteDiscoverCard } from '#shared/types/discover'

/**
 * 경로 탐색(Discover) 화면의 공유 상태를 관리하는 store composable.
 * 구역 선택, 탐색 경로 목록, 정렬 기준, 로딩 상태를 보유한다.
 */
export const useDiscoverStore = () => {
    /** 현재 선택된 서울 행정구 이름. 선택 없음이면 `null`. */
    const selectedDistrict = useState<string | null>('discover-selected-district', () => null)

    /** 탐색 결과로 반환된 경로 카드 목록 */
    const discoverRoutes = useState<RouteDiscoverCard[]>('discover-routes', () => [])

    /** 현재 적용된 정렬 기준 */
    const sortBy = useState<'distance' | 'elevation' | 'recent' | 'popular'>(
        'discover-sort-by',
        () => 'recent'
    )

    /** 경로 탐색 API 호출 중 여부 */
    const isLoading = useState('discover-is-loading', () => false)

    return {
        selectedDistrict,
        discoverRoutes,
        sortBy,
        isLoading
    }
}
