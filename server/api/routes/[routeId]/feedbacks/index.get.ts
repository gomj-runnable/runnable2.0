import { eq } from 'drizzle-orm'
import { routeFeedbacks } from '../../../../database/schema'
import { db } from '../../../../utils/db'
import { memoryFeedbacks } from '../../../../utils/memoryStore'

/** GET /api/routes/:routeId/feedbacks — 경로에 달린 피드백 목록 조회 (인증 불필요) */
export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) {
        throw createError({ statusCode: 400, message: '경로 ID가 필요합니다.' })
    }

    if (!db) {
        return memoryFeedbacks.filter((fb) => fb.routeId === routeId)
    }

    const feedbacks = await db
        .select()
        .from(routeFeedbacks)
        .where(eq(routeFeedbacks.routeId, routeId))
        .orderBy(routeFeedbacks.createdAt)

    return feedbacks
})
