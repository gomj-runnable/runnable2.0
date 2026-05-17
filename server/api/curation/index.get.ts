import { getCurationRepository } from '../../repositories'
import { withAdmin } from '../../utils/withAdmin'
import { withExceptionHandler } from '../../utils/error'

/** 관리자용: 전체 컬렉션 목록 */
export default defineEventHandler(
    withExceptionHandler(
        withAdmin(async () => {
            const repo = await getCurationRepository()
            return repo.listAllCollections()
        })
    )
)
