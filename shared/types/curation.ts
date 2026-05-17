/**
 * 계절·시간대 큐레이션.
 * 시즌·시간대에 최적인 경로를 큐레이션해 추천한다.
 * #150 참고.
 */

export type CurationSeason = 'spring' | 'summer' | 'autumn' | 'winter'

export type CurationTheme =
    | 'cherry-blossom'
    | 'autumn-leaves'
    | 'sunrise'
    | 'sunset'
    | 'night-view'
    | 'shade'
    | 'riverside'

export interface CurationCollectionBase {
    /** 컬렉션 제목 */
    title: string
    /** 설명 */
    description?: string
    /** 시즌 */
    season: CurationSeason
    /** 테마 */
    theme: CurationTheme
    /** 활성 시작일 (ISO date) */
    validFrom: string
    /** 활성 종료일 (ISO date) */
    validTo: string
    /** 커버 이미지 URL */
    coverImageUrl?: string
}

export type CurationCollectionDraftInput = CurationCollectionBase

export interface SavedCurationCollection extends CurationCollectionBase {
    collectionId: string
    createdBy: string
    routeCount: number
    createdAt: string
}

export interface CurationRouteBase {
    /** 연결된 경로 ID */
    routeId: string
    /** 추천 출발 시간 (0~23) */
    recommendedHourLocal?: number
    /** 사진 URL */
    photoUrl?: string
    /** 큐레이터 한 줄 추천 */
    note?: string
    /** 순서 */
    sortOrder: number
}

export type CurationRouteDraftInput = CurationRouteBase

export interface SavedCurationRoute extends CurationRouteBase {
    curationRouteId: string
    collectionId: string
    /** 동적 메타: 오늘 일몰 시각 등 (API에서 계산) */
    dynamicMeta?: {
        sunriseLocal?: string
        sunsetLocal?: string
        recommendedDepartureNote?: string
    }
}
