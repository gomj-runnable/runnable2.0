import type { HourlyWeather } from '#shared/types/weather'
import {
    KMA_TYP01_BASE_URL,
    SEOUL_ASOS_STATION,
    fromKstParts,
    formatDate,
    formatHour,
    formatKstMinute,
    mapConditionByCloudAndRain,
    mapPm10Grade,
    parseNumber
} from './common'

const decodeResponse = async (response: Response) => {
    const buffer = await response.arrayBuffer()
    try {
        return new TextDecoder('euc-kr').decode(buffer)
    } catch {
        return new TextDecoder('utf-8').decode(buffer)
    }
}

const parseTyp01Table = (rawText: string): Array<Record<string, string>> => {
    const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

    const normalized = lines
        .filter((line) => !line.startsWith('#------------------------------------------------'))
        .map((line) => line.replace(/^#+\s*/, ''))

    const headerIndex = normalized.findIndex((line) => /\bTM\b/.test(line) && /\bSTN\b/.test(line))
    if (headerIndex < 0) {
        return []
    }

    const headerLine = normalized[headerIndex]
    if (!headerLine) {
        return []
    }

    const delimiter = headerLine.includes(',') ? ',' : /\s+/
    const headers = headerLine
        .split(delimiter)
        .map((token) => token.trim())
        .filter(Boolean)

    if (headers.length === 0) {
        return []
    }

    const rows: Array<Record<string, string>> = []

    for (let i = headerIndex + 1; i < normalized.length; i += 1) {
        const line = normalized[i]
        if (!line || !/^\d/.test(line)) {
            continue
        }

        const values = line
            .split(delimiter)
            .map((token) => token.trim())
            .filter(Boolean)

        if (values.length < headers.length) {
            continue
        }

        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
            row[header] = values[index] ?? ''
        })
        rows.push(row)
    }

    return rows
}

const fetchTyp01Rows = async (
    endpoint: string,
    params: Record<string, string>
): Promise<Array<Record<string, string>>> => {
    const url = new URL(`${KMA_TYP01_BASE_URL}/${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
    })

    const response = await fetch(url.toString())
    if (!response.ok) {
        throw new Error(`KMA typ01 request failed (${response.status})`)
    }

    const raw = await decodeResponse(response)
    return parseTyp01Table(raw)
}

const fetchHourlyObsMap = async (
    authKey: string,
    tm1: string,
    tm2: string,
    obs: 'TA' | 'RN' | 'CA_TOT'
): Promise<Map<string, number>> => {
    const rows = await fetchTyp01Rows('kma_sfctm5.php', {
        tm1,
        tm2,
        stn: String(SEOUL_ASOS_STATION),
        obs,
        help: '0',
        authKey
    })

    const result = new Map<string, number>()

    for (const row of rows) {
        const tm = row.TM
        const value = parseNumber(row[obs])

        if (!tm || value === null || tm.length < 10) {
            continue
        }

        result.set(tm.slice(0, 10), value)
    }

    return result
}

const fetchPm10Map = async (
    authKey: string,
    tm1: string,
    tm2: string
): Promise<Map<string, number>> => {
    const rows = await fetchTyp01Rows('dst_pm10_tm.php', {
        tm_st: tm1,
        tm: tm2,
        stn: String(SEOUL_ASOS_STATION),
        org: 'kma',
        data: '1',
        help: '0',
        authKey
    })

    const result = new Map<string, number>()

    for (const row of rows) {
        const tm = row.TM
        const pm10Raw = row.PM10 ?? row.pm10 ?? row.AVG
        const pm10 = parseNumber(pm10Raw)

        if (!tm || pm10 === null || tm.length < 10) {
            continue
        }

        result.set(tm.slice(0, 10), pm10)
    }

    return result
}

export const fetchObservedWeatherSlots = async (
    authKey: string,
    start: Date,
    end: Date
): Promise<HourlyWeather[]> => {
    const tm1 = formatKstMinute(start)
    const tm2 = formatKstMinute(end)

    const [tempMap, rainMap, cloudMap, pm10Map] = await Promise.all([
        fetchHourlyObsMap(authKey, tm1, tm2, 'TA'),
        fetchHourlyObsMap(authKey, tm1, tm2, 'RN'),
        fetchHourlyObsMap(authKey, tm1, tm2, 'CA_TOT'),
        fetchPm10Map(authKey, tm1, tm2).catch(() => new Map<string, number>())
    ])

    const timestamps = Array.from(tempMap.keys()).sort((a, b) => a.localeCompare(b))

    const slots: HourlyWeather[] = []

    for (const tm of timestamps) {
        const temperature = tempMap.get(tm)
        if (typeof temperature !== 'number') {
            continue
        }

        const year = Number(tm.slice(0, 4))
        const month = Number(tm.slice(4, 6))
        const day = Number(tm.slice(6, 8))
        const hour = Number(tm.slice(8, 10))
        const date = fromKstParts(year, month, day, hour, 0)

        const rainfall = rainMap.get(tm) ?? null
        const cloudAmount = cloudMap.get(tm) ?? null
        const pm10 = pm10Map.get(tm) ?? null

        slots.push({
            date: formatDate(date),
            time: formatHour(date),
            condition: mapConditionByCloudAndRain(temperature, rainfall, cloudAmount),
            temperature,
            pm10,
            pm10Grade: pm10 === null ? null : mapPm10Grade(pm10),
            source: 'observed'
        })
    }

    return slots
}
