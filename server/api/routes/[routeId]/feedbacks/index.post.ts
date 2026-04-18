import { nanoid } from 'nanoid'
import { createFeedbackSchema } from '#shared/schemas/feedback.schema'
import { routeFeedbacks } from '../../../../database/schema'
import { db } from '../../../../utils/db'
import { getSessionUser } from '../../../../utils/session'

/** POST /api/routes/:routeId/feedbacks — 피드백 추가 (비로그인도 가능) */
export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) {
        throw createError({ statusCode: 400, message: '경로 ID가 필요합니다.' })
    }

    const body = await readBody(event)
    const input = createFeedbackSchema.parse(body)

    // 인증된 사용자라면 userId와 이름을 자동 설정
    const user = await getSessionUser(event)

    if (!db) {
        throw createError({ statusCode: 503, message: 'Memory 모드에서는 피드백 기능을 사용할 수 없습니다.' })
    }

    const feedbackId = nanoid()
    const [feedback] = await db
        .insert(routeFeedbacks)
        .values({
            feedbackId,
            routeId,
            userId: user?.userId ?? null,
            content: input.content,
            longitude: String(input.longitude),
            latitude: String(input.latitude),
            elevation: input.elevation != null ? String(input.elevation) : null,
            authorName: input.authorName ?? user?.name ?? '익명'
        })
        .returning()

    return feedback
})
