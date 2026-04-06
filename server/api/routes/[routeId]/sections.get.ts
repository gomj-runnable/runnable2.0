import { routeRepository } from '../../../repositories/route.repository.memory'

export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) throw createError({ statusCode: 400, message: 'routeId is required' })
    return routeRepository.getSectionsByRouteId(routeId)
})
