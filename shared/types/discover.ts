// 탐색(Discover) 경로 목록 필터·카드 타입 정의

/** 탐색 탭 경로 목록 필터 */
export interface RouteDiscoverFilter {
    district?: string
    sortBy?: 'distance' | 'elevation' | 'recent' | 'popular'
    limit?: number
}

/** 탐색 탭 경로 카드 표시용 요약 데이터 */
export interface RouteDiscoverCard {
    routeId: string
    title: string
    distance?: number
    highHeight?: number
    lowHeight?: number
    districts?: string[]
    createdAt?: string
    authorName?: string
    viewCount?: number
    likeCount?: number
    likedByMe?: boolean
}
