import { nanoid } from 'nanoid'
import { createFeedbackSchema } from '#shared/schemas/feedback.schema'
import { routeFeedbacks } from '../../../../database/schema'
import { db } from '../../../../utils/db'
import { requireSession } from '../../../../utils/session'
import { memoryFeedbacks } from '../../../../utils/memoryStore'

/** POST /api/routes/:routeId/feedbacks — 피드백 추가 (로그인 필수) */
export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) {
        throw createError({ statusCode: 400, message: '경로 ID가 필요합니다.' })
    }

    const user = await requireSession(event)

    const body = await readBody(event)
    const input = createFeedbackSchema.parse(body)

    const feedbackId = nanoid()
    const authorName = user.name ?? '익명'

    if (!db) {
        const memoryFeedback = {
            feedbackId,
            routeId,
            userId: user.userId,
            name: input.name,
            description: input.description,
            longitude: String(input.longitude),
            latitude: String(input.latitude),
            elevation: input.elevation != null ? String(input.elevation) : null,
            authorName,
            createdAt: new Date().toISOString()
        }
        memoryFeedbacks.push(memoryFeedback)
        return memoryFeedback
    }

    const [feedback] = await db
        .insert(routeFeedbacks)
        .values({
            feedbackId,
            routeId,
            userId: user.userId,
            name: input.name,
            description: input.description,
            longitude: String(input.longitude),
            latitude: String(input.latitude),
            elevation: input.elevation != null ? String(input.elevation) : null,
            authorName
        })
        .returning()

    return feedback
})
