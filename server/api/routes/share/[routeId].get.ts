import { routeRepository, routeInfoRepository } from '../../../repositories'
import { badRequest, notFound, forbidden } from '../../../utils/error'

/** GET /api/routes/share/:routeId — 공개 경로 + 경로정보 조회 (인증 불필요) */
export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) {
        throw badRequest('경로 ID가 필요합니다.')
    }

    const route = await routeRepository.getRoute(routeId)
    if (!route) {
        throw notFound('경로를 찾을 수 없습니다.')
    }
    if (!route.isPublic) {
        throw forbidden('비공개 경로입니다.')
    }

    const sections = await routeRepository.getSectionsByRouteId(routeId)
    const routeInfoItems = await routeInfoRepository.findByRouteId(routeId)

    return { route, sections, routeInfos: routeInfoItems }
})
