import type { H3Event } from 'h3'

/**
 * URL 경로에서 routeId 파라미터를 추출한다.
 * 값이 없으면 400 에러를 던진다.
 */
export const requireRouteIdParam = (event: H3Event): string => {
    const routeId = getRouterParam(event, 'routeId')
    if (!routeId) throw createError({ statusCode: 400, message: 'routeId is required' })
    return routeId
}
