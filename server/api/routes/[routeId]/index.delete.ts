import { routeService } from '../../../services/route.service'
import { requireRouteOwnership } from '../../../utils/session'
import { requireRouteIdParam } from '../../../utils/params'

export default defineEventHandler(async (event) => {
    const routeId = requireRouteIdParam(event)

    await requireRouteOwnership(event, routeId, routeService.getRouteById)
    await routeService.deleteRoute(routeId)
    return { success: true }
})
