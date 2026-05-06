import { routeRepository } from '../../../repositories'
import { requireRouteIdParam } from '../../../utils/params'
import { requireSession } from '../../../utils/session'
import { forbidden, notFound } from '../../../utils/error'

export default defineEventHandler(async (event) => {
    const routeId = requireRouteIdParam(event)
    const user = await requireSession(event)
    const route = await routeRepository.getRoute(routeId)
    if (!route) throw notFound('경로를 찾을 수 없습니다.')
    if (!route.isPublic && route.userId !== user.userId) throw forbidden('접근 권한이 없습니다.')
    return routeRepository.getSectionsByRouteId(routeId)
})
