/** 500 Internal Server Error */
export function internalError(message = '서버 오류가 발생했습니다.') {
    return createError({ statusCode: 500, message })
}
