import type { H3Event } from 'h3'
import { auth } from './auth'

/** 현재 요청의 인증 세션에서 userId를 추출한다. 미인증이면 null을 반환한다. */
export const getSessionUser = async (event: H3Event) => {
    const session = await auth.api.getSession({ headers: event.headers })
    if (!session?.user?.id) return null
    return {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email
    }
}

/** 인증이 필요한 엔드포인트에서 사용. 미인증이면 401 에러를 던진다. */
export const requireSession = async (event: H3Event) => {
    const user = await getSessionUser(event)
    if (!user) {
        throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
    }
    return user
}
