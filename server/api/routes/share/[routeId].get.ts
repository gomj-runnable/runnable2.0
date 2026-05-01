import { eq } from 'drizzle-orm'
import { routeInfos } from '../../../database/schema'
import { db } from '../../../utils/db'
import { routeRepository } from '../../../repositories'

/** GET /api/routes/share/:routeId — 공개 경로 + 경로정보 조회 (인증 불필요) */
export default defineEventHandler(async (event) => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) {
        throw createError({ statusCode: 400, message: '경로 ID가 필요합니다.' })
    }

    const route = await routeRepository.getRoute(routeId)
    if (!route) {
        throw createError({ statusCode: 404, message: '경로를 찾을 수 없습니다.' })
    }
    if (!route.isPublic) {
        throw createError({ statusCode: 403, message: '비공개 경로입니다.' })
    }

    const sections = await routeRepository.getSectionsByRouteId(routeId)

    // 경로정보는 아직 repository 미구현 — db가 있을 때만 조회
    const routeInfoItems = db
        ? await db
              .select()
              .from(routeInfos)
              .where(eq(routeInfos.routeId, routeId))
              .orderBy(routeInfos.createdAt)
        : []

    return { route, sections, routeInfos: routeInfoItems }
})
