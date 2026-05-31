// GET /api/routes - 로그인 시 내 경로 목록, 비로그인 시 공개 경로 목록 반환
import { routeService } from '../../services/route.service'
import { getSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
    const user = await getSessionUser(event)

    if (user) {
        return routeService.listRoutesByUser(user.userId)
    }

    return routeService.searchPublicRoutes()
})
