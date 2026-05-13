import type { RouteStats } from '#shared/types/stats'

export const useStatsStore = () => {
    const stats = useState<RouteStats | null>('stats-data', () => null)
    const isLoading = useState('stats-is-loading', () => false)

    return { stats, isLoading }
}
