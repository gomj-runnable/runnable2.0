import { getCurationRepository } from '../../../repositories'
import { withAdmin } from '../../../utils/withAdmin'
import { withExceptionHandler } from '../../../utils/error'

/** 관리자용: 큐레이션 컬렉션 삭제 */
export default defineEventHandler(
    withExceptionHandler(
        withAdmin(async (event) => {
            const collectionId = getRouterParam(event, 'collectionId')
            if (!collectionId) {
                throw createError({ statusCode: 400, statusMessage: 'collectionId is required' })
            }

            const repo = await getCurationRepository()
            const deleted = await repo.deleteCollection(collectionId)
            if (!deleted) {
                throw createError({ statusCode: 404, statusMessage: 'Collection not found' })
            }
            return { success: true }
        })
    )
)
