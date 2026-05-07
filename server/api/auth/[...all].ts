import { fromWebHandler, getCookie, setCookie, deleteCookie, getRequestURL, readBody } from 'h3'
import type { H3Event } from 'h3'
import { randomBytes } from 'crypto'
import { auth } from '#server/utils/auth'
import { memoryUsers, memorySessions, MEMORY_AUTO_LOGIN_EMAIL } from '#server/utils/memoryStore'
import { isMemoryMode } from '#server/utils/config'
import { badRequest, conflict, internalError, unauthorized } from '#server/utils/error'

/**
 * better-auth는 url을 임의로 조작하는데, 이를 위한 url 개방
 *
 * TODO: (추가확인 필요)
 */

/** 새 세션 토큰을 발급하고 쿠키에 굽는다. */
function issueSession(event: H3Event, userId: string): string {
    const sessionToken = randomBytes(32).toString('hex')
    memorySessions.set(sessionToken, userId)
    setCookie(event, 'better-auth.session_token', sessionToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || getRequestURL(event).protocol === 'https:',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
    })
    return sessionToken
}

async function handleMemoryAuth(event: H3Event) {
    const url = getRequestURL(event)
    const pathname = url.pathname.replace('/api/auth', '')

    // GET /csrf - better-auth/vue 클라이언트는 csrf 토큰을 사용하지 않으므로 빈 토큰 반환만 한다.
    if (pathname === '/csrf') {
        return { csrfToken: '' }
    }

    // GET /ok - better-auth 클라이언트 헬스체크
    if (pathname === '/ok') {
        return { ok: true }
    }

    // POST /sign-up/email
    if (pathname === '/sign-up/email' && event.method === 'POST') {
        const body = await readBody(event)
        const email = body?.email?.trim()
        const password = body?.password
        const name = body?.name?.trim() || 'User'

        if (!email || !password) {
            throw badRequest('이메일과 비밀번호를 입력해주세요.')
        }

        if (memoryUsers.has(email)) {
            throw conflict('이미 가입된 이메일입니다.')
        }

        const id = `user-${Date.now()}`
        const user = { id, name, email, password }
        memoryUsers.set(email, user)

        const sessionToken = issueSession(event, id)
        return {
            user: { id, name, email },
            session: { id: `session-${id}`, userId: id, token: sessionToken }
        }
    }

    // POST /sign-in/email
    if (pathname === '/sign-in/email' && event.method === 'POST') {
        const body = await readBody(event)
        const email = body?.email?.trim()
        const password = body?.password

        if (!email || !password) {
            throw badRequest('이메일과 비밀번호를 입력해주세요.')
        }

        const user = memoryUsers.get(email)
        if (!user || user.password !== password) {
            throw unauthorized('이메일 또는 비밀번호가 올바르지 않습니다.')
        }
        const sessionToken = issueSession(event, user.id)
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
    // 메모리 모드에서는 쿠키가 없거나 만료된 경우 자동 로그인 계정으로 세션을 발급한다.
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
        const autoUser = memoryUsers.get(MEMORY_AUTO_LOGIN_EMAIL)
        if (autoUser) {
            const newToken = issueSession(event, autoUser.id)
            return {
                user: { id: autoUser.id, name: autoUser.name, email: autoUser.email },
                session: {
                    id: `session-${autoUser.id}`,
                    userId: autoUser.id,
                    token: newToken
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
