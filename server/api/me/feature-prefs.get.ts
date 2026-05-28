import { requireSession } from '../../utils/session'
import { withExceptionHandler } from '../../utils/error'
import { getUserFeaturePrefRepository } from '../../repositories'

export default defineEventHandler(
    withExceptionHandler(async (event) => {
        const user = await requireSession(event)
        const repo = await getUserFeaturePrefRepository()
        return repo.findByUserId(user.userId)
    })
)
