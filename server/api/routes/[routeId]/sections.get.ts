import { routeRepository } from '../../../repositories'
import { requireRouteIdParam } from '../../../utils/params'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
    const routeId = requireRouteIdParam(event)
    const user = await requireSession(event)
    const route = await routeRepository.getRoute(routeId)
    if (!route) throw createError({ statusCode: 404, message: '경로를 찾을 수 없습니다.' })
    if (!route.isPublic && route.userId !== user.id) throw createError({ statusCode: 403, message: '접근 권한이 없습니다.' })
    return routeRepository.getSectionsByRouteId(routeId)
})
