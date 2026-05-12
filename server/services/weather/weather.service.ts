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
import { SEOUL_GU_DATA } from '../../utils/district/seoul-gu-data'
import {
    toDateOnly,
    formatDate,
    parseYmd,
    mapPm10Grade,
    mapPm25Grade,
    createWeatherTimeRange,
    type WeatherTimeRange
} from './common'

export interface WeatherFacadeOptions {
    authKey?: string
    openDataKey?: string
    airKoreaKey?: string
    sources?: WeatherSourceKey[]
}

const ALL_SOURCES: WeatherSourceKey[] = ['observed', 'forecast', 'airquality']

class WeatherFacade {
    private readonly observedService = new ObservedService()
    private readonly forecastService = new ForecastService()
    private readonly airQualityService = new AirQualityService()

    /** 월 단위 날씨 데이터 조회 */
    async requestByMonth(
        month: string,
        options: WeatherFacadeOptions = {}
    ): Promise<SeoulMonthlyWeather> {
        const timeRange = createWeatherTimeRange(month)
        if (!timeRange) throw new Error(`Invalid month format: ${month}. Expected YYYY-MM.`)

        const sources = options.sources ?? ALL_SOURCES
        const { airKoreaKey } = options

        const { observedSlots, forecastSlots, airQualityByGu, sourceErrors } =
            await this._fetchAllSources(timeRange, options)

        const mergedSlots = mergeWeatherSlots({
            rangeStart: timeRange.rangeStart,
            rangeEnd: timeRange.rangeEnd,
            observedSlots,
            forecastSlots
        })

        const dongs = this._enrichWithAirQuality(mergedSlots, airQualityByGu)

        return {
            baseDate: formatDate(timeRange.rangeStart),
            rangeStart: formatDate(timeRange.rangeStart),
            rangeEnd: formatDate(timeRange.rangeEnd),
            dongs,
            ...(sourceErrors.length > 0 && { sourceErrors }),
            activeSources: sources.filter((s) => s !== 'airquality' || airKoreaKey?.trim())
        }
    }

    /** 3개 소스에서 데이터를 병렬로 fetch하고 sourceErrors를 수집 */
    private async _fetchAllSources(
        timeRange: WeatherTimeRange,
        options: WeatherFacadeOptions
    ): Promise<{
        observedSlots: import('#shared/types/weather').HourlyWeather[]
        forecastSlots: import('#shared/types/weather').HourlyWeather[]
        airQualityByGu: Map<string, import('./airquality.adapter').AirQualitySlot[]>
        sourceErrors: WeatherSourceError[]
    }> {
        const { authKey, openDataKey, airKoreaKey } = options
        const sources = options.sources ?? ALL_SOURCES
        const sourceErrors: WeatherSourceError[] = []

        const observedTask =
            sources.includes('observed') && authKey?.trim()
                ? this.observedService.fetch(authKey, timeRange.rangeStart, timeRange.observedEnd)
                : Promise.resolve(null)

        const forecastTask =
            sources.includes('forecast') && openDataKey?.trim()
                ? this.forecastService.fetch(
                      openDataKey,
                      timeRange.forecastRequestDate,
                      timeRange.now
                  )
                : Promise.resolve(null)

        const airTask =
            sources.includes('airquality') && airKoreaKey?.trim()
                ? this.airQualityService.fetch(airKoreaKey)
                : Promise.resolve(null)

        const [observedResult, forecastResult, airResult] = await Promise.all([
            observedTask,
            forecastTask,
            airTask
        ])

        const observedSlots = observedResult?.slots ?? []
        if (observedResult?.error) sourceErrors.push(observedResult.error)

        const forecastSlots = forecastResult?.slots ?? []
        if (forecastResult?.error) sourceErrors.push(forecastResult.error)

        const airQualityByGu =
            airResult?.dataByGu ??
            new Map<string, import('./airquality.adapter').AirQualitySlot[]>()
        if (airResult?.error) sourceErrors.push(airResult.error)

        return { observedSlots, forecastSlots, airQualityByGu, sourceErrors }
    }

    /** PM10/PM2.5 보충 후 동별 데이터 구조화 */
    private _enrichWithAirQuality(
        mergedSlots: import('#shared/types/weather').HourlyWeather[],
        airQualityByGu: Map<string, import('./airquality.adapter').AirQualitySlot[]>
    ): DongWeather[] {
        return SEOUL_GU_DATA.map((gu) => {
            const guAirSlots = airQualityByGu.get(gu.code) ?? []
            const hourly = mergedSlots.map((slot) => {
                const matched = guAirSlots.find((aq) => {
                    const [datePart, timePart] = aq.dataTime.split(' ')
                    return datePart === slot.date && timePart === slot.time
                })

                const enriched = { ...slot }

                if (
                    enriched.pm10 === null &&
                    matched?.pm10 !== null &&
                    matched?.pm10 !== undefined
                ) {
                    enriched.pm10 = matched.pm10
                    enriched.pm10Grade = mapPm10Grade(matched.pm10)
                }

                if (matched?.pm25 !== null && matched?.pm25 !== undefined) {
                    enriched.pm25 = matched.pm25
                    enriched.pm25Grade = mapPm25Grade(matched.pm25)
                }

                return enriched
            })

            return {
                dongCode: gu.code,
                dongName: gu.name,
                nx: gu.nx,
                ny: gu.ny,
                hourly
            }
        })
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

export const weatherService = new WeatherFacade()
