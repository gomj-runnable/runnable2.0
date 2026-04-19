import { fromWebHandler, getCookie, setCookie, deleteCookie, getRequestURL, readBody } from 'h3'
import type { H3Event } from 'h3'
import { randomBytes } from 'crypto'
import { auth } from '#server/utils/auth'
import { memoryUsers } from '#server/utils/memoryStore'
import { isMemoryMode } from '#server/utils/config'

/**
 * better-auth는 url을 임의로 조작하는데, 이를 위한 url 개방
 *
 * TODO: (추가확인 필요)
 */

/** 메모리 모드 전용 CSRF 토큰 저장소. 요청마다 새 토큰을 발급한다. */
const memoryCsrfTokens = new Map<string, number>()

async function handleMemoryAuth(event: H3Event) {
    const url = getRequestURL(event)
    const pathname = url.pathname.replace('/api/auth', '')

    // GET /csrf - better-auth 클라이언트가 sign-in/sign-up 전에 호출하는 엔드포인트
    if (pathname === '/csrf') {
        const token = randomBytes(32).toString('hex')
        memoryCsrfTokens.set(token, Date.now())
        return { csrfToken: token }
    }

    // GET /ok - better-auth 클라이언트 헬스체크
    if (pathname === '/ok') {
        return { ok: true }
    }

    // POST /sign-up/email
    if (pathname === '/sign-up/email' && event.method === 'POST') {
        const body = await readBody(event)
        const id = `user-${Date.now()}`
        const user = { id, name: body.name || 'User', email: body.email, password: body.password }
        memoryUsers.set(body.email, user)

        setCookie(event, 'better-auth.session_token', `memory-session-${id}`, { path: '/' })
        return {
            user: { id, name: user.name, email: user.email },
            session: { id: `session-${id}`, userId: id, token: `memory-session-${id}` }
        }
    }

    // POST /sign-in/email
    if (pathname === '/sign-in/email' && event.method === 'POST') {
        const body = await readBody(event)
        const user = memoryUsers.get(body.email)
        if (!user || user.password !== body.password) {
            throw createError({
                statusCode: 401,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.'
            })
        }
        setCookie(event, 'better-auth.session_token', `memory-session-${user.id}`, { path: '/' })
        return {
            user: { id: user.id, name: user.name, email: user.email },
            session: {
                id: `session-${user.id}`,
                userId: user.id,
                token: `memory-session-${user.id}`
            }
        }
    }

    // GET /get-session
    if (pathname === '/get-session') {
        const token = getCookie(event, 'better-auth.session_token')
        if (token) {
            const userId = token.replace('memory-session-', '')
            const user = Array.from(memoryUsers.values()).find((u) => u.id === userId)
            if (user) {
                return {
                    user: { id: user.id, name: user.name, email: user.email },
                    session: { id: `session-${user.id}`, userId: user.id, token }
                }
            }
        }
        return null
    }

    // POST /sign-out
    if (pathname === '/sign-out') {
        deleteCookie(event, 'better-auth.session_token')
        return { success: true }
    }

    return null
}

export default defineEventHandler(async (event) => {
    if (isMemoryMode) {
        return handleMemoryAuth(event)
    }
    if (!auth) {
        throw createError({ statusCode: 503, message: 'Auth is disabled.' })
    }
    return fromWebHandler(auth.handler)(event)
})
