import { routeService } from '../../../services/route.service'
import { requireRouteIdParam } from '../../../utils/params'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
    const routeId = requireRouteIdParam(event)
    const user = await requireSession(event)

    return routeService.forkRoute(routeId, user.userId)
})
