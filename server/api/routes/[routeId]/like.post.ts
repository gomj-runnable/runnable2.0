import { routeService } from '../../../services/route.service'
import { requireSession } from '../../../utils/session'
import { conflict } from '../../../utils/error'

export default defineEventHandler(async (event) => {
    const user = await requireSession(event)
    const routeId = getRouterParam(event, 'routeId')!

    const liked = await routeService.likeRoute(user.userId, routeId)
    if (!liked) throw conflict('이미 좋아요한 경로입니다.')

    return { success: true }
})
