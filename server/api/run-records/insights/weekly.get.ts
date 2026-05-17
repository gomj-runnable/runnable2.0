import { getRunRecordRepository } from '../../../repositories'
import { withAuth } from '../../../utils/withAuth'
import { withExceptionHandler } from '../../../utils/error'

export default defineEventHandler(
    withExceptionHandler(
        withAuth(async (event, user) => {
            const query = getQuery(event)
            const weekStart = query.weekStart as string

            if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'weekStart 파라미터가 필요합니다 (YYYY-MM-DD)'
                })
            }

            const repo = await getRunRecordRepository()
            return repo.getWeeklyInsight(user.userId, weekStart)
        })
    )
)
