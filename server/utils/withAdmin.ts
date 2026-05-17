import type { H3Event } from 'h3'
import { authService, type SessionUser } from './auth.service'
import { hasPermission, Permission } from '#shared/constants/permissions'
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
 * 세션이 없으면 401, VIEW_ADMIN_PAGE 권한이 없으면 403, 통과하면 user를 콜백에 주입하고
 * `event.context.user` 에도 저장한다.
 */
export function withAdmin<T>(
    handler: (event: H3Event, user: SessionUser) => Promise<T>
): (event: H3Event) => Promise<T> {
    return async (event: H3Event) => {
        const user = await authService.requireSession(event)
        if (!hasPermission(user.role, Permission.VIEW_ADMIN_PAGE)) {
            throw forbidden('관리자 권한이 필요합니다.')
        }
        event.context.user = user
        return handler(event, user)
    }
}
