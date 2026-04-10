import type { HourlyWeather } from '#shared/types/weather'
import { VilageFcstOriginalResponse, type VilageFcstOriginalItem } from '#shared/types/weather'
import {
    addDays,
    fromKstParts,
    formatDate,
    formatHour,
    formatYmd,
    getKstHour,
    mapConditionByCloudAndRain,
    parseNumber,
    parseYmd,
    toDateOnly,
    SEOUL_GU_GRID
} from './common'

const FORECAST_BASE_TIMES = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300']

const toYmd = (date: Date): string => {
    return formatYmd(date)
}

const resolveForecastBase = (baseDate: Date): { baseDate: string; baseTime: string } => {
    const hourMinute = Number(`${String(getKstHour(baseDate)).padStart(2, '0')}00`)

    for (let index = FORECAST_BASE_TIMES.length - 1; index >= 0; index -= 1) {
        const candidate = Number(FORECAST_BASE_TIMES[index] ?? '0200')
        if (hourMinute >= candidate) {
            return {
                baseDate: toYmd(baseDate),
                baseTime: FORECAST_BASE_TIMES[index] ?? '0200'
            }
        }
    }

    const prev = addDays(baseDate, -1)
    return {
        baseDate: toYmd(prev),
        baseTime: '2300'
    }
}

const fetchVilageFcst = async (
    serviceKey: string,
    baseDate: string,
    baseTime: string,
    nx: number,
    ny: number
): Promise<VilageFcstOriginalItem[]> => {
    const url = new URL('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst')
    url.searchParams.set('serviceKey', serviceKey)
    url.searchParams.set('pageNo', '1')
    url.searchParams.set('numOfRows', '1000')
    url.searchParams.set('dataType', 'JSON')
    url.searchParams.set('base_date', baseDate)
    url.searchParams.set('base_time', baseTime)
    url.searchParams.set('nx', String(nx))
    url.searchParams.set('ny', String(ny))

    const response = await fetch(url.toString())
    if (!response.ok) {
        throw new Error(`KMA forecast request failed (${response.status})`)
    }

    const original = new VilageFcstOriginalResponse(await response.json())
    return original.response?.body?.items?.item ?? []
}

const toSlotDate = (fcstDate: string, fcstTime: string): Date | null => {
    if (!/^\d{8}$/.test(fcstDate) || !/^\d{4}$/.test(fcstTime)) {
        return null
    }

    const year = Number(fcstDate.slice(0, 4))
    const month = Number(fcstDate.slice(4, 6))
    const day = Number(fcstDate.slice(6, 8))
    const hour = Number(fcstTime.slice(0, 2))
    const date = fromKstParts(year, month, day, hour, 0)

    if (Number.isNaN(date.getTime())) {
        return null
    }

    return date
}

const mapConditionByPtySky = (
    pty: number | null,
    sky: number | null,
    tmp: number
): HourlyWeather['condition'] => {
    if (pty === 1 || pty === 4) return 'rainy'
    if (pty === 2 || pty === 3) return tmp <= 0 ? 'snowy' : 'rainy'

    if (sky === 1) return 'clear'
    if (sky === 3) return 'partly-cloudy'
    if (sky === 4) return 'cloudy'

    return mapConditionByCloudAndRain(tmp, null, null)
}

export const fetchForecastWeatherSlots = async (
    serviceKey: string,
    requestedDate: string,
    now: Date = new Date()
): Promise<HourlyWeather[]> => {
    if (!serviceKey.trim()) {
        return []
    }

    const targetDate = parseYmd(requestedDate)
    const today = toDateOnly(now)
    const isToday = targetDate ? targetDate.getTime() === today.getTime() : false
    const isFuture = targetDate ? targetDate.getTime() > today.getTime() : false
    const base = isToday || isFuture ? now : (targetDate ?? now)
    const { baseDate, baseTime } = resolveForecastBase(base)

    const seoulCenter = SEOUL_GU_GRID['11110']
    const nx = seoulCenter?.nx ?? 60
    const ny = seoulCenter?.ny ?? 127

    const items = await fetchVilageFcst(serviceKey, baseDate, baseTime, nx, ny)
    const grouped = new Map<string, Record<string, string>>()

    for (const item of items) {
        const key = `${item.fcstDate}${item.fcstTime}`
        const row = grouped.get(key) ?? {}
        row[item.category] = item.fcstValue
        grouped.set(key, row)
    }

    const slots: HourlyWeather[] = []

    for (const [key, row] of grouped.entries()) {
        const fcstDate = key.slice(0, 8)
        const fcstTime = key.slice(8, 12)
        const date = toSlotDate(fcstDate, fcstTime)
        if (!date) {
            continue
        }

        const temperature = parseNumber(row.TMP)
        if (temperature === null) {
            continue
        }

        const pty = parseNumber(row.PTY)
        const sky = parseNumber(row.SKY)

        slots.push({
            date: formatDate(date),
            time: formatHour(date),
            condition: mapConditionByPtySky(pty, sky, temperature),
            temperature,
            pm10: null,
            pm10Grade: null,
            source: 'forecast'
        })
    }

    return slots.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
}
