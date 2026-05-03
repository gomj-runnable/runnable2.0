import { routeRepository } from '../../../repositories'
import { requireRouteIdParam } from '../../../utils/params'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
    const routeId = requireRouteIdParam(event)
    const user = await requireSession(event)

    // 원본 경로 조회
    const source = await routeRepository.getRoute(routeId)
    if (!source) throw createError({ statusCode: 404, message: '경로를 찾을 수 없습니다.' })

    // 본인 경로인지 확인
    if (source.userId === user.userId) {
        throw createError({ statusCode: 409, message: '본인이 만든 경로입니다.' })
    }

    // 이미 가져온 경로인지 확인
    const alreadyForked = await routeRepository.hasRouteFromSource(user.userId, routeId)
    if (alreadyForked) {
        throw createError({ statusCode: 409, message: '이미 추가된 경로입니다.' })
    }

    // 경로 복사
    const forkedRoute = await routeRepository.createRoute(
        {
            title: source.title,
            description: source.description,
            isPublic: false,
            sourceRouteId: routeId
        },
        user.userId
    )

    // 섹션 복사
    const sourceSections = await routeRepository.getSectionsByRouteId(routeId)
    const forkedSections = await routeRepository.createSections(
        forkedRoute.routeId,
        sourceSections.map((s) => ({ geom: s.geom, attrs: s.attrs, pois: s.pois }))
    )

    return { route: forkedRoute, sections: forkedSections }
})
