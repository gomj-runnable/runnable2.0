import type { RouteStats } from '#shared/types/stats'
import { useStatsStore } from '../model/useStatsStore'

export const useStatsSideeffect = () => {
    const store = useStatsStore()

    const fetchStats = async () => {
        store.isLoading.value = true
        try {
            store.stats.value = await $fetch<RouteStats>('/api/routes/stats')
        } catch (e) {
            console.error('[Stats] 통계 로드 실패:', e)
            store.stats.value = null
        } finally {
            store.isLoading.value = false
        }
    }

    return { ...store, fetchStats }
}
