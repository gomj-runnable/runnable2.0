import { getQuery } from 'h3'
import type { SavedRoute } from '#shared/types/route'
import type { RouteCompareItem, RouteCompareResponse } from '#shared/types/route-compare'
import { routeCompareQuerySchema } from '#shared/schemas/route-compare.schema'
import { routeService } from '../../services/route.service'
import { routeCompareService } from '../../services/route-compare.service'
import { withAuth } from '../../http/withAuth'
import { badRequest, forbidden, notFound, withExceptionHandler } from '../../exceptions/error'
import type { SessionUser } from '../../security/auth/service'

const loadRouteCompareItem = async (
    routeId: string,
    user: SessionUser
): Promise<RouteCompareItem> => {
    const route: SavedRoute | null = await routeService.getRouteById(routeId)
    if (!route) throw notFound(`경로를 찾을 수 없습니다: ${routeId}`)
    if (!route.isPublic && route.userId !== user.userId)
        throw forbidden('비공개 경로에는 접근할 수 없습니다.')

    const sections = await routeService.getSectionsByRouteId(routeId)
    const meta = await routeCompareService.computeMeta(routeId)

    return { route, sections, meta }
}

/**
 * 경로 비교 엔드포인트 (#188).
 *
 * `GET /api/routes/compare?routeA={id}&routeB={id}` — 두 경로의 메타데이터·구간·집계 메트릭을 함께 반환한다.
 * 권한: 각 경로가 공개이거나 요청자 본인 소유여야 한다.
 */
export default defineEventHandler(
    withExceptionHandler(
        withAuth(async (event, user): Promise<RouteCompareResponse> => {
            const parsed = routeCompareQuerySchema.safeParse(getQuery(event))
            if (!parsed.success) throw badRequest('routeA, routeB 쿼리 파라미터가 필요합니다.')

            const { routeA, routeB } = parsed.data

            const [itemA, itemB] = await Promise.all([
                loadRouteCompareItem(routeA, user),
                loadRouteCompareItem(routeB, user)
            ])

            return { routeA: itemA, routeB: itemB }
        })
    )
)
