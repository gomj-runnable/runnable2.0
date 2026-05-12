import type { H3Event } from 'h3'
import { authService, type SessionUser } from './auth.service'
import { hasAdminAccess } from '#shared/constants/roles'
import { forbidden } from './error'

/**
 * 관리자 권한이 필요한 핸들러 래퍼.
 *
 * 사용 예:
 *   export default defineEventHandler(
 *       withExceptionHandler(
 *           withAdmin(async (event, user) => {
 *               return adminService.doSomething(user.userId)
 *           })
 *       )
 *   )
 *
 * 세션이 없으면 401, 관리자 미만 권한이면 403, 통과하면 user를 콜백에 주입하고
 * `event.context.user` 에도 저장한다.
 */
export function withAdmin<T>(
    handler: (event: H3Event, user: SessionUser) => Promise<T>
): (event: H3Event) => Promise<T> {
    return async (event: H3Event) => {
        const user = await authService.requireSession(event)
        if (!hasAdminAccess(user.role)) {
            throw forbidden('관리자 권한이 필요합니다.')
        }
        event.context.user = user
        return handler(event, user)
    }
}
