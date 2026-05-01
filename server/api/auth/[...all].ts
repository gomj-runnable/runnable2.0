import {
    fromWebHandler,
    getCookie,
    setCookie,
    deleteCookie,
    getRequestURL,
    readBody,
    getHeader
} from 'h3'
import type { H3Event } from 'h3'
import { randomBytes } from 'crypto'
import { auth } from '#server/utils/auth'
import { memoryUsers, memorySessions } from '#server/utils/memoryStore'
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
        const csrfToken = body?.csrfToken || getHeader(event, 'x-csrf-token')
        if (!csrfToken || !memoryCsrfTokens.has(csrfToken)) {
            throw createError({ statusCode: 403, message: 'Invalid CSRF token' })
        }
        memoryCsrfTokens.delete(csrfToken)

        const email = body?.email?.trim()
        const password = body?.password
        const name = body?.name?.trim() || 'User'

        if (!email || !password) {
            throw createError({ statusCode: 400, message: '이메일과 비밀번호를 입력해주세요.' })
        }

        if (memoryUsers.has(email)) {
            throw createError({ statusCode: 409, message: '이미 가입된 이메일입니다.' })
        }

        const id = `user-${Date.now()}`
        const user = { id, name, email, password }
        memoryUsers.set(email, user)

        const sessionToken = randomBytes(32).toString('hex')
        memorySessions.set(sessionToken, id)
        setCookie(event, 'better-auth.session_token', sessionToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' || getRequestURL(event).protocol === 'https:',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30
        })
        return {
            user: { id, name, email },
            session: { id: `session-${id}`, userId: id, token: sessionToken }
        }
    }

    // POST /sign-in/email
    if (pathname === '/sign-in/email' && event.method === 'POST') {
        const body = await readBody(event)
        const csrfToken = body?.csrfToken || getHeader(event, 'x-csrf-token')
        if (!csrfToken || !memoryCsrfTokens.has(csrfToken)) {
            throw createError({ statusCode: 403, message: 'Invalid CSRF token' })
        }
        memoryCsrfTokens.delete(csrfToken)

        const email = body?.email?.trim()
        const password = body?.password

        if (!email || !password) {
            throw createError({ statusCode: 400, message: '이메일과 비밀번호를 입력해주세요.' })
        }

        const user = memoryUsers.get(email)
        if (!user || user.password !== password) {
            throw createError({
                statusCode: 401,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.'
            })
        }
        const sessionToken = randomBytes(32).toString('hex')
        memorySessions.set(sessionToken, user.id)
        setCookie(event, 'better-auth.session_token', sessionToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' || getRequestURL(event).protocol === 'https:',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30
        })
        return {
            user: { id: user.id, name: user.name, email: user.email },
            session: {
                id: `session-${user.id}`,
                userId: user.id,
                token: sessionToken
            }
        }
    }

    // GET /get-session
    if (pathname === '/get-session') {
        const token = getCookie(event, 'better-auth.session_token')
        if (token) {
            const userId = memorySessions.get(token)
            const user = userId
                ? Array.from(memoryUsers.values()).find((u) => u.id === userId)
                : null
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
    try {
        return await fromWebHandler(auth.handler)(event)
    } catch (error) {
        // better-auth 내부 에러를 클라이언트에 적절히 전파
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다.'
        })
    }
})
