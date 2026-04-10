import { routeRepository } from '../../../repositories/route.repository.drizzle'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
    const user = await requireSession(event)
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) throw createError({ statusCode: 400, message: 'routeId is required' })

    const route = await routeRepository.getRoute(routeId)
    if (!route) throw createError({ statusCode: 404, message: '경로를 찾을 수 없습니다.' })
    if (route.userId !== user.userId) {
        throw createError({ statusCode: 403, message: '본인의 경로만 삭제할 수 있습니다.' })
    }

    await routeRepository.deleteRoute(routeId)
    return { success: true }
})
