import type { H3Event } from 'h3'
import { withErrorHandler } from '#server/errors'

/**
 * 모든 API 핸들러 공통 래퍼.
 * `defineEventHandler` + `withErrorHandler`(예외 → 일관된 HTTP 응답)를 한 번에 적용한다.
 *
 * 사용 예:
 *   export default commonApiHandler(async (event) => {
 *       const body = await readBody(event)
 *       return await routeService.create(body)
 *   })
 *
 * 인증이 필요하면 withAuth 를 안쪽에 합성한다:
 *   export default commonApiHandler(
 *       withAuth(async (event, user) => { ... })
 *   )
 */
export function commonApiHandler<T>(handler: (event: H3Event) => Promise<T>) {
    return defineEventHandler(withErrorHandler(handler))
}
