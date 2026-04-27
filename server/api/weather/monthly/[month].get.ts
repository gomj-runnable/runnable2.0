import { createError, defineEventHandler, getQuery } from 'h3'
import type { WeatherSourceKey } from '#shared/types/weather'
import { weatherFacade } from '../../../utils/weather/weather.facade'

const VALID_SOURCES: WeatherSourceKey[] = ['observed', 'forecast', 'airquality']

const parseSources = (raw?: string): WeatherSourceKey[] => {
    if (!raw) return [...VALID_SOURCES]
    return raw.split(',')
        .map(s => s.trim() as WeatherSourceKey)
        .filter(s => VALID_SOURCES.includes(s))
}

export default defineEventHandler(async (event) => {
    const month = event.context.params?.month
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        throw createError({
            statusCode: 400,
            message: 'month path param must be YYYY-MM'
        })
    }

    const config = useRuntimeConfig(event)
    const authKey = String(config.weatherKor ?? '').trim()
    const openDataKey = String(config.openData ?? '').trim()
    const airKoreaKey = String(config.airKoreaKey ?? '').trim()

    const query = getQuery(event)
    const sources = parseSources(query.sources as string | undefined)

    return weatherFacade.requestByMonth(month, { authKey, openDataKey, airKoreaKey, sources })
})
