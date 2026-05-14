export interface MonthlyRouteStat {
    /** YYYY-MM 형식 */
    month: string
    count: number
    totalDistanceKm: number
}

export interface RouteStats {
    routeCount: number
    totalDistanceKm: number
    /** highHeight - lowHeight 합산 (고도차 근사값) */
    totalElevationChangeM: number
    monthlyStats: MonthlyRouteStat[]
}
