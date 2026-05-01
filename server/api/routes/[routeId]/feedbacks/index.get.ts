import { routeInfoRepository } from '../../../../repositories'
import { badRequest } from '../../../../utils/error'

/** GET /api/routes/:routeId/feedbacks — 경로에 달린 경로정보 목록 조회 (인증 불필요) */
export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) {
        throw badRequest('경로 ID가 필요합니다.')
    }

    return routeInfoRepository.findByRouteId(routeId)
})
