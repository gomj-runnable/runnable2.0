import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'
import { badRequest } from '#server/errors/errors/error-400'
import { internalError } from '#server/errors/errors/error-500'

/**
 * API 핸들러를 try/catch로 감싸는 래퍼.
 * 예상치 못한 에러를 500으로 변환하고 로깅한다.
 *
 * 사용 예:
 *   export default defineEventHandler(withErrorHandler(async (event) => {
 *       const body = await readBody(event)
 *       return await routeRepository.createRoute(body)
 *   }))
 */
export function withErrorHandler<T>(
    handler: (event: H3Event) => Promise<T>
): (event: H3Event) => Promise<T> {
    return async (event: H3Event) => {
        try {
            return await handler(event)
        } catch (error: unknown) {
            // H3 createError로 생성된 에러는 그대로 전파
            if (error instanceof Error && 'statusCode' in error) {
                throw error
            }

            // Zod ValidationError → 400 (스키마 세부사항 노출 방지)
            if (error instanceof Error && error.name === 'ZodError') {
                console.warn(
                    `[Validation] ${event.method} ${getRequestURL(event).pathname}:`,
                    error.message
                )
                throw badRequest('요청 데이터가 유효하지 않습니다.')
            }

            // 예상치 못한 에러 → 500 + 로깅
            console.error(`[API Error] ${event.method} ${event.path}:`, error)
            throw internalError()
        }
    }
}
