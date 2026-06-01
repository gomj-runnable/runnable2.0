import type { H3Event } from 'h3'
import { authService } from '../utils/auth.service'
import type { SavedRoute } from '../repositories/route.repository'

/** 현재 요청의 인증 세션에서 userId를 추출한다. 미인증이면 null을 반환한다. */
export const getSessionUser = (event: H3Event) => authService.getSession(event)

/** 인증이 필요한 엔드포인트에서 사용. 미인증이면 401 에러를 던진다. */
export const requireSession = (event: H3Event) => authService.requireSession(event)

/**
 * 경로 소유권 확인이 필요한 엔드포인트에서 사용.
 * 미인증이면 401, 경로가 없으면 404, 소유자가 다르면 403 에러를 던진다.
 *
 * @param getRoute - routeId로 경로를 조회하는 콜백 (서비스 또는 레포에서 주입).
 */
export const requireRouteOwnership = async (
    event: H3Event,
    routeId: string,
    getRoute: (id: string) => Promise<SavedRoute | null>
): Promise<SavedRoute> => {
    const user = await authService.requireSession(event)
    const route = await getRoute(routeId)
    if (!route) throw createError({ statusCode: 404, message: '경로를 찾을 수 없습니다.' })
    if (route.userId !== user.userId) {
        throw createError({ statusCode: 403, message: '본인의 경로만 접근할 수 있습니다.' })
    }
    return route
}
