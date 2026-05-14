import { routeService } from '../../services/route.service'
import { requireSession } from '../../utils/session'
import type { RouteStats, MonthlyRouteStat } from '#shared/types/stats'

export default defineEventHandler(async (event) => {
    const user = await requireSession(event)
    const routes = await routeService.listRoutesByUser(user.userId)

    const routeCount = routes.length
    const totalDistanceKm = routes.reduce((sum, r) => sum + (r.distance ?? 0), 0) / 1000
    const totalElevationChangeM = routes.reduce((sum, r) => {
        const gain = (r.highHeight ?? 0) - (r.lowHeight ?? 0)
        return sum + (gain > 0 ? gain : 0)
    }, 0)

    const monthlyMap = new Map<string, { count: number; distanceM: number }>()
    for (const r of routes) {
        if (!r.createdAt) continue
        const d = new Date(r.createdAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const entry = monthlyMap.get(key) ?? { count: 0, distanceM: 0 }
        entry.count += 1
        entry.distanceM += r.distance ?? 0
        monthlyMap.set(key, entry)
    }

    const monthlyStats: MonthlyRouteStat[] = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, { count, distanceM }]) => ({
            month,
            count,
            totalDistanceKm: distanceM / 1000
        }))

    const result: RouteStats = {
        routeCount,
        totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
        totalElevationChangeM: Math.round(totalElevationChangeM),
        monthlyStats
    }

    return result
})
