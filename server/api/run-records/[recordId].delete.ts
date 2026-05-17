import { getRunRecordRepository } from '../../repositories'
import { withAuth } from '../../utils/withAuth'
import { withExceptionHandler } from '../../utils/error'

export default defineEventHandler(
    withExceptionHandler(
        withAuth(async (event, user) => {
            const recordId = getRouterParam(event, 'recordId')
            if (!recordId) {
                throw createError({ statusCode: 400, statusMessage: 'recordId is required' })
            }

            const repo = await getRunRecordRepository()
            const existing = await repo.getById(recordId)
            if (!existing) {
                throw createError({ statusCode: 404, statusMessage: 'Record not found' })
            }
            if (existing.userId !== user.userId) {
                throw createError({
                    statusCode: 403,
                    statusMessage: '본인의 기록만 삭제할 수 있습니다.'
                })
            }

            await repo.delete(recordId)
            return { success: true }
        })
    )
)
