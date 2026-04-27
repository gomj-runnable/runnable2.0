import { createError, defineEventHandler } from 'h3'
import { weatherFacade } from '../../utils/weather/weather.facade'

export default defineEventHandler(async (event) => {
    const dateParam = event.context.params?.date
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        throw createError({
            statusCode: 400,
            message: 'date path param must be YYYY-MM-DD'
        })
    }

    const config = useRuntimeConfig(event)
    const authKey = String(config.weatherKor ?? '').trim()
    const openDataKey = String(config.openData ?? '').trim()
    const airKoreaKey = String(config.airKoreaKey ?? '').trim()

    return weatherFacade.requestByDate(dateParam, { authKey, openDataKey, airKoreaKey })
})
