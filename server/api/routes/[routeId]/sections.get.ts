// GET /api/routes/:routeId/sections - 경로의 구간(section) 목록 조회
import { routeService } from '../../../services/route.service'
import { requireRouteIdParam } from '../../../utils/params'
import { withAuth } from '../../../utils/withAuth'
import { forbidden, notFound } from '../../../utils/error'

export default defineEventHandler(
    withAuth(async (event, user) => {
        const routeId = requireRouteIdParam(event)
        const route = await routeService.getRouteById(routeId)
        if (!route) throw notFound('경로를 찾을 수 없습니다.')
        if (!route.isPublic && route.userId !== user.userId)
            throw forbidden('접근 권한이 없습니다.')
        return routeService.getSectionsByRouteId(routeId)
    })
)
