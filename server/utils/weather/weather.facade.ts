import type {
    DongWeather,
    SeoulMonthlyWeather,
    WeatherSourceKey,
    WeatherSourceError,
    MonthAvailability
} from '#shared/types/weather'
import { ObservedService } from './observed.service'
import { ForecastService } from './forecast.service'
import { AirQualityService } from './airquality.service'
import { mergeWeatherSlots } from './merge.service'
import { SEOUL_GU_DATA } from '../district/seoul-gu-data'
import {
    addDays,
    toDateOnly,
    truncateToKstHour,
    withKstHour,
    formatDate,
    parseYmd,
    mapPm10Grade,
    fromKstParts
} from './common'

export interface WeatherFacadeOptions {
    authKey?: string
    openDataKey?: string
    airKoreaKey?: string
    sources?: WeatherSourceKey[]
}

const ALL_SOURCES: WeatherSourceKey[] = ['observed', 'forecast', 'airquality']

// Parse "YYYY-MM" to { start: Date, end: Date } for the month range
const parseMonthRange = (month: string): { start: Date; end: Date } | null => {
    if (!/^\d{4}-\d{2}$/.test(month)) return null
    const [yearRaw = '', monthRaw = ''] = month.split('-')
    const year = Number(yearRaw)
    const mon = Number(monthRaw)
    if (!year || !mon || mon < 1 || mon > 12) return null
    const start = fromKstParts(year, mon, 1, 0, 0)
    // Last day: go to next month day 1, subtract 1 day
    const end = withKstHour(addDays(fromKstParts(year, mon + 1, 1, 0, 0), -1), 23)
    return { start, end }
}

class WeatherFacade {
    private readonly observedService = new ObservedService()
    private readonly forecastService = new ForecastService()
    private readonly airQualityService = new AirQualityService()

    /** 월 단위 날씨 데이터 조회 */
    async requestByMonth(
        month: string,
        options: WeatherFacadeOptions = {}
    ): Promise<SeoulMonthlyWeather> {
        const range = parseMonthRange(month)
        if (!range) throw new Error(`Invalid month format: ${month}. Expected YYYY-MM.`)

        const { authKey, openDataKey, airKoreaKey } = options
        const sources = options.sources ?? ALL_SOURCES
        const now = truncateToKstHour(new Date())

        const sourceErrors: WeatherSourceError[] = []

        // Observed
        let observedSlots: import('#shared/types/weather').HourlyWeather[] = []
        if (sources.includes('observed') && authKey?.trim()) {
            const observedEnd = range.end.getTime() > now.getTime() ? now : range.end
            const result = await this.observedService.fetch(authKey, range.start, observedEnd)
            observedSlots = result.slots
            if (result.error) sourceErrors.push(result.error)
        }

        // Forecast
        let forecastSlots: import('#shared/types/weather').HourlyWeather[] = []
        if (sources.includes('forecast') && openDataKey?.trim()) {
            const result = await this.forecastService.fetch(
                openDataKey,
                formatDate(range.start),
                now
            )
            forecastSlots = result.slots
            if (result.error) sourceErrors.push(result.error)
        }

        // Airquality
        let airQualityByGu = new Map<string, import('./airquality.adapter').AirQualitySlot[]>()
        if (sources.includes('airquality') && airKoreaKey?.trim()) {
            const result = await this.airQualityService.fetch(airKoreaKey)
            airQualityByGu = result.dataByGu
            if (result.error) sourceErrors.push(result.error)
        }

        // Merge observed + forecast
        const mergedSlots = mergeWeatherSlots({
            rangeStart: range.start,
            rangeEnd: range.end,
            observedSlots,
            forecastSlots
        })

        // PM10 보충 (airquality data → merged slots)
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

        return {
            baseDate: formatDate(range.start),
            rangeStart: formatDate(range.start),
            rangeEnd: formatDate(range.end),
            dongs,
            ...(sourceErrors.length > 0 && { sourceErrors }),
            activeSources: sources.filter((s) => s !== 'airquality' || airKoreaKey?.trim())
        }
    }

    /** 하위호환: 날짜 기준 조회 (해당 날짜의 월 전체를 조회) */
    async requestByDate(
        requestedDate?: string,
        options: WeatherFacadeOptions = {}
    ): Promise<SeoulMonthlyWeather> {
        const parsed = requestedDate ? parseYmd(requestedDate) : null
        const baseDate = parsed ?? toDateOnly(new Date())
        const isoDate = formatDate(baseDate)
        const month = isoDate.slice(0, 7) // "YYYY-MM"
        return this.requestByMonth(month, options)
    }

    /** 캘린더용: 해당 월에 데이터가 있는 날짜 목록 반환 */
    async getAvailability(
        month: string,
        options: WeatherFacadeOptions = {}
    ): Promise<MonthAvailability> {
        const data = await this.requestByMonth(month, options)

        const observedDates = new Set<string>()
        const forecastDates = new Set<string>()
        const airDates = new Set<string>()

        const firstDong = data.dongs[0]
        if (firstDong) {
            for (const slot of firstDong.hourly) {
                if (slot.source === 'observed') observedDates.add(slot.date)
                if (slot.source === 'forecast') forecastDates.add(slot.date)
                if (slot.pm10 !== null) airDates.add(slot.date)
            }
        }

        const sources = options.sources ?? ALL_SOURCES
        const allDates = new Set<string>()
        if (sources.includes('observed')) observedDates.forEach((d) => allDates.add(d))
        if (sources.includes('forecast')) forecastDates.forEach((d) => allDates.add(d))
        if (sources.includes('airquality')) airDates.forEach((d) => allDates.add(d))

        return {
            month,
            availableDates: Array.from(allDates).sort(),
            sourceAvailability: {
                observed: Array.from(observedDates).sort(),
                forecast: Array.from(forecastDates).sort(),
                airquality: Array.from(airDates).sort()
            }
        }
    }
}

export const weatherFacade = new WeatherFacade()
