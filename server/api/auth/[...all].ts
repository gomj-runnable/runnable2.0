import { fromWebHandler } from 'h3'
import { getAuthInstance } from '#server/utils/auth'
import { internalError } from '#server/utils/error'

export default defineEventHandler(async (event) => {
    try {
        const auth = await getAuthInstance()
        return await fromWebHandler(auth.handler)(event)
    } catch (error) {
        // H3 에러는 그대로 전파
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }
        // better-auth 내부 에러 로깅 + 전파
        console.error('[auth] better-auth handler error:', error)
        throw internalError(
            error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다.'
        )
    }
})
