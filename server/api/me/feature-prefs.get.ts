// GET /api/me/feature-prefs - 로그인 사용자의 플러그인 기능 활성화 설정 조회
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
