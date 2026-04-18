import { eq } from 'drizzle-orm'
import { routeFeedbacks } from '../../../database/schema'
import { db } from '../../../utils/db'
import { routeRepository } from '../../../repositories'

/** GET /api/routes/share/:routeId — 공개 경로 + 피드백 조회 (인증 불필요) */
export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) {
        throw createError({ statusCode: 400, message: '경로 ID가 필요합니다.' })
    }

    const route = await routeRepository.getRoute(routeId)
    if (!route) {
        throw createError({ statusCode: 404, message: '경로를 찾을 수 없습니다.' })
    }

    const sections = await routeRepository.getSectionsByRouteId(routeId)

    // 피드백은 아직 repository 미구현 — db가 있을 때만 조회
    const feedbacks = db
        ? await db
            .select()
            .from(routeFeedbacks)
            .where(eq(routeFeedbacks.routeId, routeId))
            .orderBy(routeFeedbacks.createdAt)
        : []

    return { route, sections, feedbacks }
})
