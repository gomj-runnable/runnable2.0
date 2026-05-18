import { routeService } from '../../../services/route.service'
import { requireSession } from '../../../utils/session'
import { requireRouteIdParam } from '../../../utils/params'
import { conflict, withExceptionHandler } from '../../../utils/error'

export default defineEventHandler(
    withExceptionHandler(async (event) => {
        const user = await requireSession(event)
        const routeId = requireRouteIdParam(event)

        const route = await routeService.getRouteById(routeId)
        if (!route) throw createError({ statusCode: 404, message: '경로를 찾을 수 없습니다.' })
        if (!route.isPublic && route.userId !== user.userId) {
            throw createError({ statusCode: 403, message: '비공개 경로입니다.' })
        }

        const unliked = await routeService.unlikeRoute(user.userId, routeId)
        if (!unliked) throw conflict('좋아요하지 않은 경로입니다.')

        return { success: true }
    })
)
