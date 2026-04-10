// ─────────────────────────────────────────────
// 1. 공통 Local Response (shared/types/air.ts)
// ─────────────────────────────────────────────

export type AirSource = 'kma' | 'opendata' | 'fallback'

/** 공통 Local Response — KMA와 공공데이터포털 결과를 통합 */
export interface AirLocalResponse {
    stationName: string
    date: string
    time: string
    pm10: number | null
    pm25: number | null
    source: AirSource
}

// ─────────────────────────────────────────────
// 2. 각 API 원본 Response Class
// ─────────────────────────────────────────────

/** KMA 미세먼지 원본 응답 */
export class KmaAirOriginalResponse {
    data?: Array<{
        stnId: string
        tm: string
        pm10Value: string
        pm25Value: string
        stationName: string
    }>

    constructor(raw: unknown) {
        Object.assign(this, raw)
    }
}

/** 공공데이터포털 대기질 원본 응답 */
export class OpendataAirOriginalResponse {
    response?: {
        body?: {
            items?: Array<{
                stationName: string
                dataTime: string
                pm10Value: string
                pm25Value: string
                pm10Grade: string
            }>
        }
    }

    constructor(raw: unknown) {
        Object.assign(this, raw)
    }
}

// ─────────────────────────────────────────────
// 3. Adapter — 각자 원본 → 공통 변환
// ─────────────────────────────────────────────

// server/utils/air/kma.adapter.ts
async function kmaRequestByDate(date: string): Promise<AirLocalResponse[]> {
    const res = await fetch(`https://apihub.kma.go.kr/...?date=${date}`)
    const original = new KmaAirOriginalResponse(await res.json())

    return (original.data ?? []).map((item) => ({
        stationName: item.stationName,
        date: item.tm.slice(0, 10),
        time: item.tm.slice(11, 16),
        pm10: item.pm10Value ? Number(item.pm10Value) : null,
        pm25: item.pm25Value ? Number(item.pm25Value) : null,
        source: 'kma' as const,
    }))
}

// server/utils/air/opendata.adapter.ts
async function opendataRequestByDate(date: string): Promise<AirLocalResponse[]> {
    const res = await fetch(`https://apis.data.go.kr/...?date=${date}`)
    const original = new OpendataAirOriginalResponse(await res.json())

    return (original.response?.body?.items ?? []).map((item) => ({
        stationName: item.stationName,
        date: item.dataTime.slice(0, 10),
        time: item.dataTime.slice(11, 16),
        pm10: item.pm10Value !== '-' ? Number(item.pm10Value) : null,
        pm25: item.pm25Value !== '-' ? Number(item.pm25Value) : null,
        source: 'opendata' as const,
    }))
}

// ─────────────────────────────────────────────
// 4. Merge — 우선순위 기반 통합
// ─────────────────────────────────────────────

const SOURCE_PRIORITY: Record<AirSource, number> = {
    kma: 3,
    opendata: 2,
    fallback: 1,
}

function mergeAirResponses(...sources: AirLocalResponse[][]): AirLocalResponse[] {
    const map = new Map<string, AirLocalResponse>()

    for (const slots of sources) {
        for (const slot of slots) {
            const key = `${slot.stationName}_${slot.date}_${slot.time}`
            const existing = map.get(key)

            if (!existing || SOURCE_PRIORITY[slot.source] > SOURCE_PRIORITY[existing.source]) {
                map.set(key, slot)
            }
        }
    }

    return Array.from(map.values())
}

// ─────────────────────────────────────────────
// 5. Service — 오케스트레이터
// ─────────────────────────────────────────────

class AirService {
    /** 날짜 기준 조회 — 호출부만 분기, 이후는 공통 */
    async requestByDate(date: string): Promise<AirLocalResponse[]> {
        const [kmaSlots, opendataSlots] = await Promise.all([
            kmaRequestByDate(date).catch(() => []),
            opendataRequestByDate(date).catch(() => []),
        ])

        return mergeAirResponses(kmaSlots, opendataSlots)
    }
}

export const airService = new AirService()

// ─────────────────────────────────────────────
// 6. 후속 로직 — 공통 함수만 사용 (API 출처 무관)
// ─────────────────────────────────────────────

/** ✅ 공통 Local Response만 다루는 함수 */
function filterByStation(data: AirLocalResponse[], station: string): AirLocalResponse[] {
    return data.filter((d) => d.stationName === station)
}

/** ✅ 공통 Local Response만 다루는 함수 */
function getLatestReading(data: AirLocalResponse[]): AirLocalResponse | null {
    return data.sort((a, b) => b.time.localeCompare(a.time))[0] ?? null
}

// 사용 예시:
// const response = await airService.requestByDate('2026-04-10')
// const gangnam = filterByStation(response, '강남구')
// const latest = getLatestReading(gangnam)
