// PUT /api/me/feature-prefs - 로그인 사용자의 플러그인 기능 활성화 상태 업서트
import { z } from 'zod'
import { requireSession } from '../../http/session'
import { badRequest } from '#server/errors'
import { commonApiHandler } from '#server/http/commonApiHandler'
import { getUserFeaturePrefRepository } from '../../repositories'

const bodySchema = z.object({
    pluginId: z.string().min(1),
    enabled: z.boolean()
})

export default commonApiHandler(async (event) => {
    const user = await requireSession(event)
    const parsed = bodySchema.safeParse(await readBody(event))
    if (!parsed.success) {
        throw badRequest('pluginId(문자열)와 enabled(boolean)이 필요합니다.')
    }
    const repo = await getUserFeaturePrefRepository()
    return repo.upsert(user.userId, parsed.data.pluginId, parsed.data.enabled)
})
