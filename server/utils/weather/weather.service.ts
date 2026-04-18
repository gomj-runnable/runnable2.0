import type { DongWeather, HourlyWeather, SeoulMonthlyWeather } from '#shared/types/weather'
import { fetchSeoulAirQuality } from './airquality.adapter'
import { fetchForecastWeatherSlots } from './forecast.adapter'
import { mergeWeatherSlots } from './merge.service'
import { fetchObservedWeatherSlots } from './observed.adapter'
import { SEOUL_GU_DATA } from '../district/seoul-gu-data'
import {
    addDays,
    mapPm10Grade,
    parseYmd,
    toDateOnly,
    truncateToKstHour,
    withKstHour
} from './common'

export interface WeatherRequestOptions {
    authKey?: string
    openDataKey?: string
    airKoreaKey?: string
}

const toBaseDate = (requestedDate?: string): Date => {
    const fromParam = requestedDate ? parseYmd(requestedDate) : null
    if (fromParam) return fromParam
    return toDateOnly(new Date())
}

const toIsoDate = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

class WeatherService {
    /** 날짜 기준 서울 날씨 조회 */
    async requestByDate(
        requestedDate?: string,
        options: WeatherRequestOptions = {}
    ): Promise<SeoulMonthlyWeather> {
        const { authKey, openDataKey, airKoreaKey } = options
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

        const airQualityPromise = fetchSeoulAirQuality(airKoreaKey ?? '').catch((error) => {
            console.error('[WeatherService] airquality adapter failed, fallback continues', error)
            return new Map<string, import('./airquality.adapter').AirQualitySlot[]>()
        })

        const [observedSlots, forecastSlots, airQualityByGu] = await Promise.all([
            observedPromise.catch((error) => {
                console.error('[WeatherService] observed adapter failed, fallback continues', error)
                return []
            }),
            forecastPromise.catch((error) => {
                console.error('[WeatherService] forecast adapter failed, fallback continues', error)
                return []
            }),
            airQualityPromise
        ])

        const mergedSlots = mergeWeatherSlots({
            baseDate,
            observedSlots,
            forecastSlots
        })

        const dongs: DongWeather[] = SEOUL_GU_DATA.map((gu) => {
            const guAirSlots = airQualityByGu.get(gu.code) ?? []
            const hourly = mergedSlots.map((slot) => {
                if (slot.pm10 !== null) return { ...slot }

                const matched = guAirSlots.find((aq) => {
                    const [datePart, timePart] = aq.dataTime.split(' ')
                    return datePart === slot.date && timePart === slot.time
                })

                if (matched?.pm10 !== null && matched?.pm10 !== undefined) {
                    return {
                        ...slot,
                        pm10: matched.pm10,
                        pm10Grade: mapPm10Grade(matched.pm10)
                    }
                }

                return { ...slot }
            })

            return {
                dongCode: gu.code,
                dongName: gu.name,
                nx: gu.nx,
                ny: gu.ny,
                hourly
            }
        })

        const rangeStart = toDateOnly(addDays(baseDate, -30))
        const rangeEnd = toDateOnly(addDays(baseDate, 31))

        return {
            baseDate: requestedDate && parseYmd(requestedDate) ? requestedDate : toIsoDate(baseDate),
            rangeStart: toIsoDate(rangeStart),
            rangeEnd: toIsoDate(rangeEnd),
            dongs
        }
    }
}

export const weatherService = new WeatherService()
