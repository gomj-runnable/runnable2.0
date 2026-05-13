import { routeService } from '../../../services/route.service'
import { requireSession } from '../../../utils/session'
import { conflict } from '../../../utils/error'

export default defineEventHandler(async (event) => {
    const user = await requireSession(event)
    const routeId = getRouterParam(event, 'routeId')!

    const unliked = await routeService.unlikeRoute(user.userId, routeId)
    if (!unliked) throw conflict('좋아요하지 않은 경로입니다.')

    return { success: true }
})
