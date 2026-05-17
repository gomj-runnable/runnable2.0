import { createCurationRouteSchema } from '#shared/schemas/curation.schema'
import { getCurationRepository } from '../../../repositories'
import { withAdmin } from '../../../utils/withAdmin'
import { withExceptionHandler } from '../../../utils/error'

/** 관리자용: 큐레이션 컬렉션에 경로 추가 */
export default defineEventHandler(
    withExceptionHandler(
        withAdmin(async (event) => {
            const collectionId = getRouterParam(event, 'collectionId')
            if (!collectionId) {
                throw createError({ statusCode: 400, statusMessage: 'collectionId is required' })
            }

            const body = await readBody(event)
            const input = createCurationRouteSchema.parse(body)

            const repo = await getCurationRepository()
            return repo.addRoute(collectionId, input)
        })
    )
)
