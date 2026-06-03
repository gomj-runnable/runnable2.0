/**
 * errors 패키지 공개 진입점.
 *
 * - error-400/500: 상태 코드별 에러 팩토리 (badRequest, notFound, internalError 등)
 * - error-handler: API 핸들러 예외 래퍼 (withErrorHandler)
 *
 * 소비처는 개별 파일이 아닌 이 배럴(`#server/errors`)에서 가져온다.
 */
export * from './errors/error-400'
export * from './errors/error-500'
export * from './error-handler'
