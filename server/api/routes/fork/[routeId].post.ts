import { routeService } from '../../../services/route.service'
import { requireRouteIdParam } from '../../../utils/params'
import { requireSession } from '../../../utils/session'
import { withExceptionHandler } from '../../../utils/error'

export default defineEventHandler(
    withExceptionHandler(async (event) => {
        const routeId = requireRouteIdParam(event)
        const user = await requireSession(event)

        const route = await routeService.getRouteById(routeId)
        if (!route) throw createError({ statusCode: 404, message: '경로를 찾을 수 없습니다.' })
        if (!route.isPublic) {
            throw createError({ statusCode: 403, message: '비공개 경로는 포크할 수 없습니다.' })
        }

        return routeService.forkRoute(routeId, user.userId)
    })
)
