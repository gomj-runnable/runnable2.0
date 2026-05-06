import { defineEventHandler, getQuery } from 'h3'
import { weatherFacade } from '../../../utils/weather/weather.facade'
import { parseSources, resolveWeatherKeys } from '../../../utils/weather/event'
import { badRequest } from '../../../utils/error'

export default defineEventHandler(async (event) => {
    const month = event.context.params?.month
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        throw badRequest('month path param must be YYYY-MM')
    }

    const keys = resolveWeatherKeys(event)
    const query = getQuery(event)
    const sources = parseSources(query.sources as string | undefined)

    return weatherFacade.requestByMonth(month, { ...keys, sources })
})
