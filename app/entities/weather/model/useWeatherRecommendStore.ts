import type { RecommendedRoute } from '#shared/types/weather-recommend'

/**
 * 날씨 기반 추천 경로 목록과 로딩 상태를 관리하는 store composable.
 * `useState`로 전역 공유 상태를 제공하며 데이터 반영에만 집중한다.
 */
export const useWeatherRecommendStore = () => {
    /** 추천 경로 목록. 미로드 상태이면 빈 배열. */
    const recommendedRoutes = useState<RecommendedRoute[]>('weatherRecommend.routes', () => [])
    /** 추천 경로 로딩 중 여부 */
    const isLoading = useState<boolean>('weatherRecommend.isLoading', () => false)

    /** 추천 경로 목록을 교체한다 */
    const setRoutes = (routes: RecommendedRoute[]) => {
        recommendedRoutes.value = routes
    }

    return {
        recommendedRoutes,
        isLoading,
        setRoutes
    }
}
