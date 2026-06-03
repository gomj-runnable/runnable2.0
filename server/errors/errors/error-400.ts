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
