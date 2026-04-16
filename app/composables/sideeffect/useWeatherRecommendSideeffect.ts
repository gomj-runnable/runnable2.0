import type { RecommendedRoute } from '#shared/types/weather-recommend'
import { useWeatherRecommendStore } from '~/composables/store/useWeatherRecommendStore'

/**
 * 날씨 기반 추천 경로를 서버에서 불러와 store에 반영하는 sideeffect composable.
 * 페이지 마운트 또는 날씨 데이터 갱신 시점에 호출한다.
 */
export const useWeatherRecommendSideeffect = () => {
    const { recommendedRoutes, isLoading, setRoutes } = useWeatherRecommendStore()

    /**
     * 서버에서 추천 경로를 불러와 store에 저장한다.
     *
     * @param limit - 반환할 최대 경로 수 (기본 5)
     */
    const fetchRecommendedRoutes = async (limit = 5) => {
        isLoading.value = true
        try {
            const data = await $fetch<RecommendedRoute[]>('/api/routes/recommend', {
                query: { limit }
            })
            setRoutes(data)
        } catch (err) {
            console.error('[WeatherRecommendSideeffect] recommend fetch failed', err)
        } finally {
            isLoading.value = false
        }
    }

    return {
        recommendedRoutes,
        isLoading,
        fetchRecommendedRoutes
    }
}
