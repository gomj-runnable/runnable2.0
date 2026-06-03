// GET /api/routes/:routeId/feedbacks - 경로에 달린 피드백(루트인포) 목록 조회
import { getRouteInfoRepository } from '../../../../repositories'
import { routeService } from '../../../../services/route.service'
import { requireRouteIdParam } from '../../../../http/params'
import { getSessionUser } from '../../../../http/session'
import { commonApiHandler } from '#server/http/commonApiHandler'

export default commonApiHandler(async (event) => {
    const routeId = requireRouteIdParam(event)

    const route = await routeService.getRouteById(routeId)
    if (!route) throw createError({ statusCode: 404, message: '경로를 찾을 수 없습니다.' })

    if (!route.isPublic) {
        const session = await getSessionUser(event)
        if (!session || route.userId !== session.userId) {
            throw createError({ statusCode: 403, message: '비공개 경로입니다.' })
        }
    }

    return (await getRouteInfoRepository()).findByRouteId(routeId)
})
