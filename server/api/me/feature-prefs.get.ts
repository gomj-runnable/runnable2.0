// GET /api/me/feature-prefs - 로그인 사용자의 플러그인 기능 활성화 설정 조회
import { requireSession } from '../../http/session'
import { commonApiHandler } from '#server/http/commonApiHandler'
import { getUserFeaturePrefRepository } from '../../repositories'

export default commonApiHandler(async (event) => {
    const user = await requireSession(event)
    const repo = await getUserFeaturePrefRepository()
    return repo.findByUserId(user.userId)
})
