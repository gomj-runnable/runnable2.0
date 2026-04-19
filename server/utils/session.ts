import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import { auth } from './auth'
import { memoryUsers } from './memoryStore'
import { routeRepository } from '../repositories'
import type { SavedRoute } from '../repositories/route.repository'
import { isMemoryMode } from './config'
const DEV_USER = { userId: 'dev-user', name: 'Dev User', email: 'dev@localhost' }

/** 현재 요청의 인증 세션에서 userId를 추출한다. 미인증이면 null을 반환한다. */
export const getSessionUser = async (event: H3Event) => {
    if (isMemoryMode) {
        const token = getCookie(event, 'better-auth.session_token')
        if (token) {
            const userId = token.replace('memory-session-', '')
            const user = Array.from(memoryUsers.values()).find((u) => u.id === userId)
            if (user) {
                return { userId: user.id, name: user.name, email: user.email }
            }
        }
        return null
    }

    if (!auth) throw createError({ statusCode: 503, message: '인증 서비스를 사용할 수 없습니다.' })
    const session = await auth.api.getSession({ headers: event.headers })
    if (!session?.user?.id) return null
    return {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email
    }
}

/** 인증이 필요한 엔드포인트에서 사용. 미인증이면 401 에러를 던진다. */
export const requireSession = async (event: H3Event) => {
    const user = await getSessionUser(event)
    if (!user) {
        throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
    }
    return user
}

/**
 * 경로 소유권 확인이 필요한 엔드포인트에서 사용.
 * 미인증이면 401, 경로가 없으면 404, 소유자가 다르면 403 에러를 던진다.
 */
export const requireRouteOwnership = async (
    event: H3Event,
    routeId: string
): Promise<SavedRoute> => {
    const user = await requireSession(event)
    const route = await routeRepository.getRoute(routeId)
    if (!route) throw createError({ statusCode: 404, message: '경로를 찾을 수 없습니다.' })
    if (route.userId !== user.userId) {
        throw createError({ statusCode: 403, message: '본인의 경로만 접근할 수 있습니다.' })
    }
    return route
}
