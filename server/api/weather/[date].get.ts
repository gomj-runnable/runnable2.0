import { defineEventHandler } from 'h3'
import { weatherService } from '../../services/weather/weather.service'
import { resolveWeatherKeys } from '../../services/weather/event'
import { badRequest } from '../../utils/error'

export default defineEventHandler(async (event) => {
    const dateParam = event.context.params?.date
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        throw badRequest('date path param must be YYYY-MM-DD')
    }

    return weatherService.requestByDate(dateParam, resolveWeatherKeys(event))
})
