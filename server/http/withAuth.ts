import type { H3Event } from 'h3'
import { auth, type SessionUser } from '../security/auth/service'

/**
 * 인증이 필요한 핸들러 래퍼.
 *
 * 사용 예:
 *   export default defineEventHandler(
 *       withExceptionHandler(
 *           withAuth(async (event, user) => {
 *               return doSomething(user.userId)
 *           })
 *       )
 *   )
 *
 * 세션이 없으면 401, 있으면 user를 콜백에 주입하고 `event.context.user` 에도 저장한다.
 */
export function withAuth<T>(
    handler: (event: H3Event, user: SessionUser) => Promise<T>
): (event: H3Event) => Promise<T> {
    return async (event: H3Event) => {
        const user = await auth.requireSession(event)
        event.context.user = user
        return handler(event, user)
    }
}
