import type { AirKoreaRltmItem } from '#shared/types/weather'
import { AirKoreaOriginalResponse } from '#shared/types/weather'
import { parseNumber, mapPm10Grade, SEOUL_GU_GRID } from './common'

const AIRKOREA_BASE_URL = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1시간
const MAX_CONCURRENT = 5

export interface AirQualitySlot {
    stationName: string
    guCode: string
    dataTime: string   // "2026-04-10 14:00"
    pm10: number | null
    pm10Grade: ReturnType<typeof mapPm10Grade> | null
}

// ─── 캐시 ─────────────────────────────────────────────────────
let cachedResult: Map<string, AirQualitySlot[]> | null = null
let cacheTimestamp = 0

const isCacheValid = () => cachedResult !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS

// ─── 동시 요청 제한 ───────────────────────────────────────────
const runWithConcurrency = async <T>(
    tasks: (() => Promise<T>)[],
    limit: number
): Promise<PromiseSettledResult<T>[]> => {
    const results: PromiseSettledResult<T>[] = new Array(tasks.length)
    let index = 0

    const worker = async () => {
        while (index < tasks.length) {
            const current = index++
            const task = tasks[current]
            if (!task) continue
            try {
                results[current] = { status: 'fulfilled', value: await task() }
            } catch (reason) {
                results[current] = { status: 'rejected', reason }
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()))
    return results
}

// ─── API 호출 ─────────────────────────────────────────────────
const fetchStationRltm = async (
    serviceKey: string,
    stationName: string
): Promise<AirKoreaRltmItem[]> => {
    const url = new URL(AIRKOREA_BASE_URL)
    url.searchParams.set('serviceKey', serviceKey)
    url.searchParams.set('stationName', stationName)
    url.searchParams.set('dataTerm', 'DAILY')
    url.searchParams.set('returnType', 'json')
    url.searchParams.set('numOfRows', '24')
    url.searchParams.set('pageNo', '1')
    url.searchParams.set('ver', '1.3')

    const response = await fetch(url.toString())
    if (!response.ok) {
        throw new Error(`AirKorea request failed for ${stationName} (${response.status})`)
    }

    const original = new AirKoreaOriginalResponse(await response.json())
    return original.response?.body?.items ?? []
}

const guNameToCode = new Map<string, string>(
    Object.entries(SEOUL_GU_GRID).map(([code, entry]) => [entry.name, code])
)

const parseAirKoreaItems = (items: AirKoreaRltmItem[]): AirQualitySlot[] => {
    const slots: AirQualitySlot[] = []

    for (const item of items) {
        const pm10 = parseNumber(item.pm10Value === '-' ? null : item.pm10Value)
        const guCode = guNameToCode.get(item.stationName) ?? ''

        slots.push({
            stationName: item.stationName,
            guCode,
            dataTime: item.dataTime,
            pm10,
            pm10Grade: pm10 !== null ? mapPm10Grade(pm10) : null
        })
    }

    return slots
}

/** 서울 전체 구의 실시간 미세먼지 데이터를 조회 (1시간 캐싱, 동시 5개 제한) */
export const fetchSeoulAirQuality = async (
    serviceKey: string
): Promise<Map<string, AirQualitySlot[]>> => {
    if (!serviceKey.trim()) {
        return new Map()
    }

    if (isCacheValid()) {
        return cachedResult!
    }

    const guNames = Object.values(SEOUL_GU_GRID).map((entry) => entry.name)

    const tasks = guNames.map((name) => async () => {
        const items = await fetchStationRltm(serviceKey, name)
        return { name, items }
    })

    const results = await runWithConcurrency(tasks, MAX_CONCURRENT)

    const slotsByGu = new Map<string, AirQualitySlot[]>()

    for (const result of results) {
        if (result.status !== 'fulfilled') continue
        const { name, items } = result.value
        const guCode = guNameToCode.get(name)
        if (!guCode) continue
        slotsByGu.set(guCode, parseAirKoreaItems(items))
    }

    cachedResult = slotsByGu
    cacheTimestamp = Date.now()

    return slotsByGu
}

/** 서울 전체 구의 최신 PM10 값을 guCode → pm10 Map으로 반환 */
export const fetchLatestPm10Map = async (
    serviceKey: string
): Promise<Map<string, number>> => {
    const slotsByGu = await fetchSeoulAirQuality(serviceKey)
    const pm10Map = new Map<string, number>()

    for (const [guCode, slots] of slotsByGu) {
        const latest = slots.find((s) => s.pm10 !== null)
        if (latest?.pm10 !== null && latest?.pm10 !== undefined) {
            pm10Map.set(guCode, latest.pm10)
        }
    }

    return pm10Map
}
