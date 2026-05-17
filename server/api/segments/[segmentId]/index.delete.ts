import { getSegmentRepository } from '../../../repositories'
import { withAuth } from '../../../utils/withAuth'
import { withExceptionHandler } from '../../../utils/error'

export default defineEventHandler(
    withExceptionHandler(
        withAuth(async (event, user) => {
            const segmentId = getRouterParam(event, 'segmentId')
            if (!segmentId) {
                throw createError({ statusCode: 400, statusMessage: 'segmentId is required' })
            }

            const repo = await getSegmentRepository()
            const segment = await repo.getSegment(segmentId)
            if (!segment) {
                throw createError({ statusCode: 404, statusMessage: 'Segment not found' })
            }
            if (segment.ownerId !== user.userId) {
                throw createError({
                    statusCode: 403,
                    statusMessage: '본인의 세그먼트만 삭제할 수 있습니다.'
                })
            }

            await repo.deleteSegment(segmentId)
            return { success: true }
        })
    )
)
