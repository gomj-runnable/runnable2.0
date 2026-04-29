import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'

/**
 * API 핸들러에서 일관된 에러 응답을 생성하는 유틸리티.
 *
 * 사용 예:
 *   throw badRequest('잘못된 요청입니다.')
 *   throw notFound('경로를 찾을 수 없습니다.')
 *   throw forbidden('권한이 없습니다.')
 */

/** 400 Bad Request */
export function badRequest(message = '잘못된 요청입니다.') {
    return createError({ statusCode: 400, message })
}

/** 401 Unauthorized */
export function unauthorized(message = '인증이 필요합니다.') {
    return createError({ statusCode: 401, message })
}

/** 403 Forbidden */
export function forbidden(message = '권한이 없습니다.') {
    return createError({ statusCode: 403, message })
}

/** 404 Not Found */
export function notFound(message = '리소스를 찾을 수 없습니다.') {
    return createError({ statusCode: 404, message })
}

/** 409 Conflict */
export function conflict(message = '요청이 충돌합니다.') {
    return createError({ statusCode: 409, message })
}

/** 500 Internal Server Error */
export function internalError(message = '서버 오류가 발생했습니다.') {
    return createError({ statusCode: 500, message })
}

/**
 * API 핸들러를 try/catch로 감싸는 래퍼.
 * 예상치 못한 에러를 500으로 변환하고 로깅한다.
 *
 * 사용 예:
 *   export default defineEventHandler(withExceptionHandler(async (event) => {
 *       const body = await readBody(event)
 *       return await routeRepository.createRoute(body)
 *   }))
 */
export function withExceptionHandler<T>(
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
                console.warn(`[Validation] ${event.method} ${getRequestURL(event).pathname}:`, error.message)
                throw badRequest('요청 데이터가 유효하지 않습니다.')
            }

            // 예상치 못한 에러 → 500 + 로깅
            console.error(`[API Error] ${event.method} ${event.path}:`, error)
            throw internalError()
        }
    }
}
