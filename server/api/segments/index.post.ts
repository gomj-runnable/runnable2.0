import { createSegmentSchema } from '#shared/schemas/segment.schema'
import { getSegmentRepository } from '../../repositories'
import { withAuth } from '../../utils/withAuth'
import { withExceptionHandler } from '../../utils/error'

export default defineEventHandler(
    withExceptionHandler(
        withAuth(async (event, user) => {
            const body = await readBody(event)
            const input = createSegmentSchema.parse(body)

            // 최소 거리 검증: 200m
            if (input.distanceKm < 0.2) {
                throw createError({
                    statusCode: 400,
                    statusMessage: '세그먼트는 최소 200m 이상이어야 합니다.'
                })
            }

            const repo = await getSegmentRepository()
            return repo.createSegment(input, user.userId)
        })
    )
)
