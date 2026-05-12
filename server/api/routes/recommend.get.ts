import { getQuery } from 'h3'
import { weatherService } from '../../services/weather/weather.service'
import { resolveWeatherKeys } from '../../services/weather/event'
import { formatDate, formatHour } from '../../services/weather/common'
import { routeService } from '../../services/route.service'
import type { WeatherMetrics, RecommendedRoute } from '#shared/types/weather-recommend'

/**
 * 현재 날씨를 기반으로 적합도가 높은 공개 경로를 추천한다.
 * GET /api/routes/recommend?limit=5
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const limit = Math.min(Number(query.limit ?? 5), 20)

    const keys = resolveWeatherKeys(event)

    const [monthlyWeather, routes] = await Promise.all([
        weatherService.requestByDate(undefined, keys).catch((err) => {
            console.error('[recommend] weather fetch failed', err)
            return null
        }),
        routeService.searchPublicRoutes().catch((err) => {
            console.error('[recommend] route fetch failed', err)
            return []
        })
    ])

    const currentWeather = resolveCurrentWeather(monthlyWeather)

    const scored: RecommendedRoute[] = routes.map((route) => {
        const { score, tags } = calculateSuitability(currentWeather, {
            distance: route.distance,
            highHeight: route.highHeight,
            lowHeight: route.lowHeight
        })
        return {
            routeId: route.routeId,
            title: route.title,
            distance: route.distance,
            highHeight: route.highHeight,
            lowHeight: route.lowHeight,
            score,
            tags
        }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, limit)
})

const resolveCurrentWeather = (
    monthlyWeather: Awaited<ReturnType<typeof weatherService.requestByDate>> | null
): WeatherMetrics => {
    const fallback: WeatherMetrics = {
        temperature: 20,
        precipitation: 0,
        windSpeed: 3,
        humidity: 60
    }
    if (!monthlyWeather) return fallback

    const now = new Date()
    const todayStr = formatDate(now)
    const hourStr = formatHour(now)

    const slots: Array<{ temperature: number; precipitation: number }> = []

    for (const dong of monthlyWeather.dongs) {
        const slot = dong.hourly.find((h) => h.date === todayStr && h.time === hourStr)
        if (slot) {
            const precipitation = slot.condition === 'rainy' || slot.condition === 'snowy' ? 2 : 0
            slots.push({ temperature: slot.temperature, precipitation })
        }
    }

    if (slots.length === 0) return fallback

    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length
    return {
        temperature: avg(slots.map((s) => s.temperature)),
        precipitation: avg(slots.map((s) => s.precipitation)),
        windSpeed: 0,
        humidity: 60
    }
}

const calculateSuitability = (
    weather: WeatherMetrics,
    route: { distance?: number; highHeight?: number; lowHeight?: number }
): { score: number; tags: string[] } => {
    const scoreTemperate = (t: number): number => {
        if (t >= 15 && t <= 25) return 100
        if (t >= 10 && t < 15) return 80
        if (t > 25 && t <= 30) return 75
        if (t >= 5 && t < 10) return 55
        if (t > 30 && t <= 35) return 40
        if (t >= 0 && t < 5) return 30
        if (t > 35) return 15
        return 10
    }

    const scoreRain = (p: number): number => {
        if (p <= 0) return 100
        if (p < 1) return 60
        if (p < 5) return 30
        return 5
    }

    const scoreWind = (w: number): number => {
        if (w < 5) return 100
        if (w < 10) return 70
        if (w < 15) return 40
        return 15
    }

    const base =
        scoreTemperate(weather.temperature) * 0.4 +
        scoreRain(weather.precipitation) * 0.35 +
        scoreWind(weather.windSpeed) * 0.25

    const elevDiff = (route.highHeight ?? 0) - (route.lowHeight ?? 0)
    const distKm = (route.distance ?? 5000) / 1000
    const isHot = weather.temperature > 30
    const isRainy = weather.precipitation > 0
    const isCold = weather.temperature < 0
    const isPerfect =
        weather.temperature >= 15 &&
        weather.temperature <= 25 &&
        weather.precipitation <= 0 &&
        weather.windSpeed < 5

    let bonus = 0
    if (isPerfect && elevDiff > 100) bonus += 5
    if ((isHot || isRainy || isCold) && elevDiff > 200) bonus -= 10
    if ((isHot || isRainy || isCold) && elevDiff <= 50) bonus += 5
    if ((isHot || isRainy || isCold) && distKm <= 5) bonus += 8
    if ((isHot || isRainy || isCold) && distKm > 10) bonus -= 8

    const score = Math.max(0, Math.min(100, Math.round(base + bonus)))

    const tags: string[] = []
    if (isPerfect) {
        tags.push('#달리기좋은날')
        if (elevDiff > 100) tags.push('#전망맛집')
    }
    if (isRainy && distKm <= 5) tags.push('#비올때도OK')
    if (weather.windSpeed >= 10) tags.push('#바람주의')
    if (isHot) {
        tags.push('#더위주의')
        if (distKm <= 5) tags.push('#단거리추천')
    }
    if (isCold) {
        tags.push('#추위주의')
        if (distKm <= 5) tags.push('#단거리추천')
    }
    if (elevDiff > 200 && isPerfect && !tags.includes('#전망맛집')) tags.push('#전망맛집')

    return { score, tags }
}
