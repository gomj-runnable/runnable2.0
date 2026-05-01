import { getQuery } from 'h3'
import { weatherFacade } from '../../utils/weather/weather.facade'
import { routeRepository } from '../../repositories'
import type { WeatherMetrics, RecommendedRoute } from '#shared/types/weather-recommend'

/**
 * 현재 날씨를 기반으로 적합도가 높은 공개 경로를 추천한다.
 * GET /api/routes/recommend?limit=5
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const limit = Math.min(Number(query.limit ?? 5), 20)

    const config = useRuntimeConfig(event)
    const authKey = String(config.weatherKor ?? '').trim()
    const openDataKey = String(config.openData ?? '').trim()
    const airKoreaKey = String(config.airKoreaKey ?? '').trim()

    // 날씨 데이터와 공개 경로를 병렬로 조회한다
    const [monthlyWeather, routes] = await Promise.all([
        weatherFacade
            .requestByDate(undefined, { authKey, openDataKey, airKoreaKey })
            .catch((err) => {
                console.error('[recommend] weather fetch failed', err)
                return null
            }),
        routeRepository.searchPublicRoutes().catch((err) => {
            console.error('[recommend] route fetch failed', err)
            return []
        })
    ])

    // 현재 시각 기준 날씨 슬롯에서 서울 전체 평균 조건을 추출한다
    const currentWeather = resolveCurrentWeather(monthlyWeather)

    // 각 경로에 적합도 점수를 계산하고 상위 N개를 반환한다
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

/** 월별 날씨 데이터에서 현재 시각에 가장 가까운 슬롯의 서울 평균 기상 조건을 추출한다 */
const resolveCurrentWeather = (
    monthlyWeather: Awaited<ReturnType<typeof weatherFacade.requestByDate>> | null
): WeatherMetrics => {
    const fallback: WeatherMetrics = {
        temperature: 20,
        precipitation: 0,
        windSpeed: 3,
        humidity: 60
    }
    if (!monthlyWeather) return fallback

    const now = new Date()
    const kstOffset = 9 * 60 * 60 * 1000
    const kst = new Date(now.getTime() + kstOffset)
    const todayStr = kst.toISOString().slice(0, 10)
    const hourStr = `${String(kst.getUTCHours()).padStart(2, '0')}:00`

    const slots: Array<{ temperature: number; precipitation: number }> = []

    for (const dong of monthlyWeather.dongs) {
        const slot = dong.hourly.find((h) => h.date === todayStr && h.time === hourStr)
        if (slot) {
            // HourlyWeather에 강수량 수치가 없으므로 condition으로 강수 여부를 판단한다
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

/** 날씨·경로 속성으로 적합도를 계산한다 (서버 사이드 순수 함수) */
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
