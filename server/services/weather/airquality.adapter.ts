import type { AirKoreaRltmItem } from '#shared/types/weather'
import { AirKoreaOriginalResponse } from '#shared/types/weather'
import { parseNumber, mapPm10Grade, mapPm25Grade } from './common'
import type { IAirQualityAdapter } from './common'
import { SEOUL_GU_DATA } from '../../utils/district/seoul-gu-data'

const AIRKOREA_BASE_URL =
    'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1시간
const MAX_CONCURRENT = 5

export interface AirQualitySlot {
    stationName: string
    guCode: string
    dataTime: string // "2026-04-10 14:00"
    pm10: number | null
    pm10Grade: ReturnType<typeof mapPm10Grade> | null
    pm25: number | null
    pm25Grade: ReturnType<typeof mapPm25Grade> | null
}

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

const guNameToCode = new Map<string, string>(SEOUL_GU_DATA.map((gu) => [gu.name, gu.code]))

const parseAirKoreaItems = (items: AirKoreaRltmItem[]): AirQualitySlot[] => {
    const slots: AirQualitySlot[] = []

    for (const item of items) {
        const pm10 = parseNumber(item.pm10Value === '-' ? null : item.pm10Value)
        const pm25 = parseNumber(item.pm25Value === '-' ? null : item.pm25Value)
        const guCode = guNameToCode.get(item.stationName) ?? ''

        slots.push({
            stationName: item.stationName,
            guCode,
            dataTime: item.dataTime,
            pm10,
            pm10Grade: pm10 !== null ? mapPm10Grade(pm10) : null,
            pm25,
            pm25Grade: pm25 !== null ? mapPm25Grade(pm25) : null
        })
    }

    return slots
}

/**
 * AirQuality 데이터는 시간당 1회 갱신되는 실시간 측정값이며 모든 요청에 동일한 결과를 반환하므로
 * 1시간 인메모리 캐시를 둔다. observed/forecast adapter는 요청 시각·기간이 매번 다르므로 캐시하지 않는다.
 */
export class AirQualityAdapter implements IAirQualityAdapter {
    private cachedResult: Map<string, AirQualitySlot[]> | null = null
    private cacheTimestamp = 0

    private isCacheValid(): boolean {
        return this.cachedResult !== null && Date.now() - this.cacheTimestamp < CACHE_TTL_MS
    }

    private async fetchStationRltm(
        serviceKey: string,
        stationName: string
    ): Promise<AirKoreaRltmItem[]> {
        const params = new URLSearchParams()
        params.set('stationName', stationName)
        params.set('dataTerm', 'DAILY')
        params.set('returnType', 'json')
        params.set('numOfRows', '24')
        params.set('pageNo', '1')
        params.set('ver', '1.3')

        const url = `${AIRKOREA_BASE_URL}?serviceKey=${serviceKey}&${params.toString()}`

        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`AirKorea request failed for ${stationName} (${response.status})`)
        }

        const original = new AirKoreaOriginalResponse(await response.json())
        return original.response?.body?.items ?? []
    }

    /** 서울 전체 구의 실시간 미세먼지 데이터를 조회 (1시간 캐싱, 동시 5개 제한) */
    async fetchSeoulAirQuality(serviceKey: string): Promise<Map<string, AirQualitySlot[]>> {
        if (!serviceKey.trim()) {
            return new Map()
        }

        if (this.isCacheValid()) {
            return this.cachedResult!
        }

        const guNames = SEOUL_GU_DATA.map((gu) => gu.name)

        const tasks = guNames.map((name) => async () => {
            const items = await this.fetchStationRltm(serviceKey, name)
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

        this.cachedResult = slotsByGu
        this.cacheTimestamp = Date.now()

        return slotsByGu
    }

    /** 서울 전체 구의 최신 PM10 값을 guCode → pm10 Map으로 반환 */
    async fetchLatestPm10Map(serviceKey: string): Promise<Map<string, number>> {
        const slotsByGu = await this.fetchSeoulAirQuality(serviceKey)
        const pm10Map = new Map<string, number>()

        for (const [guCode, slots] of slotsByGu) {
            const latest = slots.find((s) => s.pm10 !== null)
            if (latest?.pm10 !== null && latest?.pm10 !== undefined) {
                pm10Map.set(guCode, latest.pm10)
            }
        }

        return pm10Map
    }
}

// ─── 기존 함수형 API 유지 (하위 호환) ────────────────────────
const _defaultAdapter = new AirQualityAdapter()

/** @deprecated 직접 AirQualityAdapter 인스턴스를 사용하거나 WeatherService를 통해 접근하세요 */
export const fetchSeoulAirQuality = (serviceKey: string) =>
    _defaultAdapter.fetchSeoulAirQuality(serviceKey)

/** @deprecated 직접 AirQualityAdapter 인스턴스를 사용하거나 WeatherService를 통해 접근하세요 */
export const fetchLatestPm10Map = (serviceKey: string) =>
    _defaultAdapter.fetchLatestPm10Map(serviceKey)
