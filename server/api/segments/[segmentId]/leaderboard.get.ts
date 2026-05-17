import { getSegmentRepository } from '../../../repositories'
import { getSessionUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
    const segmentId = getRouterParam(event, 'segmentId')
    if (!segmentId) {
        throw createError({ statusCode: 400, statusMessage: 'segmentId is required' })
    }

    const user = await getSessionUser(event)
    const repo = await getSegmentRepository()
    return repo.getLeaderboard(segmentId, user?.userId, 10)
})
