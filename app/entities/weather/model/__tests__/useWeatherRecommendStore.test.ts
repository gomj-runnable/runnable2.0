import { describe, it, expect } from 'vitest'
import { useWeatherRecommendStore } from '../useWeatherRecommendStore'

describe('useWeatherRecommendStore', () => {
    it('초기값: 빈 routes, isLoading=false', () => {
        const s = useWeatherRecommendStore()
        expect(s.recommendedRoutes.value).toEqual([])
        expect(s.isLoading.value).toBe(false)
    })

    it('setRoutes 가 routes 를 교체', () => {
        const s = useWeatherRecommendStore()
        const routes = [{ routeId: 'r-1', score: 90 }] as any
        s.setRoutes(routes)
        expect(s.recommendedRoutes.value).toEqual(routes)
    })
})
