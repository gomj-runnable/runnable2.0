import { fromWebHandler } from 'h3'
import { auth } from '#server/utils/auth'

/**
 * better-auth는 url을 임의로 조작하는데, 이를 위한 url 개방
 *
 * TODO: (추가확인 필요)
 */
export default defineEventHandler((event) => {
    if (!auth) {
        throw createError({ statusCode: 503, message: 'Auth is disabled in MEMORY mode.' })
    }
    return fromWebHandler(auth.handler)(event)
})
