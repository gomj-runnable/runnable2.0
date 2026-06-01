// DELETE /api/routes/:routeId - 경로 삭제 (소유자 본인만 허용)
import { routeService } from '../../../services/route.service'
import { requireRouteOwnership } from '../../../http/session'
import { requireRouteIdParam } from '../../../http/params'

export default defineEventHandler(async (event) => {
    const routeId = requireRouteIdParam(event)

    await requireRouteOwnership(event, routeId, routeService.getRouteById)
    await routeService.deleteRoute(routeId)
    return { success: true }
})
