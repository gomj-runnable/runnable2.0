import { createEffortSchema } from '#shared/schemas/segment.schema'
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

            const body = await readBody(event)
            const input = createEffortSchema.parse({ ...body, segmentId })

            // 부정행위 방지: 페이스 상한선 (2분/km = 120초/km 미만은 자동 거부)
            if (input.paceSecPerKm < 120) {
                throw createError({
                    statusCode: 400,
                    statusMessage: '비정상적인 페이스입니다. (최소 2분/km)'
                })
            }

            const repo = await getSegmentRepository()

            // 세그먼트 존재 확인
            const segment = await repo.getSegment(segmentId)
            if (!segment) {
                throw createError({ statusCode: 404, statusMessage: 'Segment not found' })
            }

            return repo.createEffort(input, user.userId)
        })
    )
)
