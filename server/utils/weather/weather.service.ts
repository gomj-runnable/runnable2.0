import type { DongWeather, HourlyWeather, SeoulMonthlyWeather } from '#shared/types/weather'
import { fetchForecastWeatherSlots } from './forecast.adapter'
import { mergeWeatherSlots } from './merge.service'
import { fetchObservedWeatherSlots } from './observed.adapter'
import {
    SEOUL_GU_GRID,
    addDays,
    parseYmd,
    toDateOnly,
    truncateToKstHour,
    withKstHour
} from './common'

export interface BuildSeoulWeatherOptions {
    requestedDate?: string
    authKey?: string
    openDataKey?: string
}

const toBaseDate = (requestedDate?: string): Date => {
    const fromParam = requestedDate ? parseYmd(requestedDate) : null
    if (fromParam) return fromParam
    return toDateOnly(new Date())
}

export const buildSeoulWeather = async ({
    requestedDate,
    authKey,
    openDataKey
}: BuildSeoulWeatherOptions): Promise<SeoulMonthlyWeather> => {
    const baseDate = toBaseDate(requestedDate)
    const now = truncateToKstHour(new Date())
    const today = toDateOnly(now)

    const observedStart = toDateOnly(addDays(baseDate, -30))
    const observedEnd = new Date(now)
    if (baseDate.getTime() < today.getTime()) {
        observedEnd.setTime(withKstHour(baseDate, 23).getTime())
    }

    const observedPromise =
        authKey && observedStart <= observedEnd
            ? fetchObservedWeatherSlots(authKey, observedStart, observedEnd)
            : Promise.resolve<HourlyWeather[]>([])

    const forecastPromise = fetchForecastWeatherSlots(openDataKey ?? '', toIsoDate(baseDate), now)

    const [observedSlots, forecastSlots] = await Promise.all([
        observedPromise.catch((error) => {
            console.error('[WeatherService] observed adapter failed, fallback continues', error)
            return []
        }),
        forecastPromise.catch((error) => {
            console.error('[WeatherService] forecast adapter failed, fallback continues', error)
            return []
        })
    ])

    const mergedSlots = mergeWeatherSlots({
        baseDate,
        observedSlots,
        forecastSlots
    })

    const dongs: DongWeather[] = Object.entries(SEOUL_GU_GRID).map(([guCode, gu]) => ({
        dongCode: guCode,
        dongName: gu.name,
        nx: gu.nx,
        ny: gu.ny,
        hourly: mergedSlots
    }))

    const rangeStart = toDateOnly(addDays(baseDate, -30))
    const rangeEnd = toDateOnly(addDays(baseDate, 31))

    return {
        baseDate: requestedDate && parseYmd(requestedDate) ? requestedDate : toIsoDate(baseDate),
        rangeStart: toIsoDate(rangeStart),
        rangeEnd: toIsoDate(rangeEnd),
        dongs
    }
}

const toIsoDate = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}
