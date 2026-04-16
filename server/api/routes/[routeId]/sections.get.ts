import { routeRepository } from '../../../repositories'
import { requireRouteIdParam } from '../../../utils/params'

export default defineEventHandler(async (event) => {
    const routeId = requireRouteIdParam(event)
    return routeRepository.getSectionsByRouteId(routeId)
})
