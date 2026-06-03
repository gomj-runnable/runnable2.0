// GET /api/routes/share/:routeId - 공개 경로 공유 페이지용 상세 데이터 조회 (조회수 증가 포함)
import { routeService } from '../../../services/route.service'
import { getRouteInfoRepository } from '../../../repositories'
import { badRequest, notFound, forbidden } from '../../../errors/error'

export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) {
        throw badRequest('경로 ID가 필요합니다.')
    }

    const route = await routeService.getRouteById(routeId)
    if (!route) {
        throw notFound('경로를 찾을 수 없습니다.')
    }
    if (!route.isPublic) {
        throw forbidden('비공개 경로입니다.')
    }

    await routeService.incrementViewCount(routeId)

    const sections = await routeService.getSectionsByRouteId(routeId)
    const routeInfoItems = await (await getRouteInfoRepository()).findByRouteId(routeId)

    return { route, sections, routeInfos: routeInfoItems }
})
