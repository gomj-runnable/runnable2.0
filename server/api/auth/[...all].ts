// ALL /api/auth/* - better-auth 핸들러로 인증 요청을 위임
import { fromWebHandler } from 'h3'
import { getAuthInstance } from '#server/config/auth'
import { internalError } from '#server/utils/error'
import { getEnvMode, ENVIRONMENT_MODE } from '#server/config/envMode'

/**
 * 범용 HTTP 핸들러 Wrapper
 *
 * 모든 HTTP 요청이 해당 Handler를 거친다.
 */
export default defineEventHandler(async (event) => {
    try {
        const auth = await getAuthInstance()
        return await fromWebHandler(auth.handler)(event)
    } catch (error) {
        // H3 에러는 그대로 전파
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }
        // better-auth 내부 에러 로깅 + 운영에서는 메시지 숨김
        console.error('[auth] better-auth handler error:', error)
        throw internalError(
            getEnvMode() === ENVIRONMENT_MODE.PRODUCT
                ? '인증 처리 중 오류가 발생했습니다.'
                : error instanceof Error
                  ? error.message
                  : '인증 처리 중 오류가 발생했습니다.'
        )
    }
})
