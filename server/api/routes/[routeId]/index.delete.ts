import { routeRepository } from '../../../repositories'
import { requireRouteOwnership } from '../../../utils/session'

export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) throw createError({ statusCode: 400, message: 'routeId is required' })

    await requireRouteOwnership(event, routeId)
    await routeRepository.deleteRoute(routeId)
    return { success: true }
})
