import { getRunRecordRepository } from '../../repositories'
import { withAuth } from '../../utils/withAuth'
import { withExceptionHandler } from '../../utils/error'

export default defineEventHandler(
    withExceptionHandler(
        withAuth(async (event, user) => {
            const query = getQuery(event)
            const limit = Number(query.limit) || 50
            const offset = Number(query.offset) || 0
            const repo = await getRunRecordRepository()
            return repo.listByUser(user.userId, limit, offset)
        })
    )
)
