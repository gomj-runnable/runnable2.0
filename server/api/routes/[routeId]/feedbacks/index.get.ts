import { routeInfoService } from '../../../../services/routeInfo.service'
import { badRequest } from '../../../../utils/error'

export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) {
        throw badRequest('경로 ID가 필요합니다.')
    }

    return routeInfoService.findByRouteId(routeId)
})
