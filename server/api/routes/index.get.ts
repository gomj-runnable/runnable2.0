import { routeService } from '../../services/route.service'
import { getSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
    const user = await getSessionUser(event)

    if (user) {
        return routeService.listRoutesByUser(user.userId)
    }

    return routeService.searchPublicRoutes()
})
