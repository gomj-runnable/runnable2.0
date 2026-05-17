import { createCurationCollectionSchema } from '#shared/schemas/curation.schema'
import { getCurationRepository } from '../../repositories'
import { withAdmin } from '../../utils/withAdmin'
import { withExceptionHandler } from '../../utils/error'

/** 관리자용: 큐레이션 컬렉션 생성 */
export default defineEventHandler(
    withExceptionHandler(
        withAdmin(async (event, user) => {
            const body = await readBody(event)
            const input = createCurationCollectionSchema.parse(body)
            const repo = await getCurationRepository()
            return repo.createCollection(input, user.userId)
        })
    )
)
