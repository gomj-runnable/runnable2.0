import { routeRepository } from '../../../repositories'
import { requireRouteOwnership } from '../../../utils/session'
import { requireRouteIdParam } from '../../../utils/params'

export default defineEventHandler(async (event) => {
    const routeId = requireRouteIdParam(event)

    await requireRouteOwnership(event, routeId, routeRepository)
    await routeRepository.deleteRoute(routeId)
    return { success: true }
})
