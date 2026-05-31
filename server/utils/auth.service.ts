// 세션 조회/검증 로직을 추상화한 인증 서비스 (IAuthService 인터페이스 + 구현체)
import type { H3Event } from 'h3'
import { ROLES } from '#shared/constants/roles'
import { getAuthInstance } from './auth'

export interface SessionUser {
    userId: string
    name: string
    email: string
    role: number
}

export interface IAuthService {
    getSession(event: H3Event): Promise<SessionUser | null>
    requireSession(event: H3Event): Promise<SessionUser>
}

export const authService: IAuthService = {
    async getSession(event) {
        const auth = await getAuthInstance()
        const session = await auth.api.getSession({ headers: event.headers })
        if (!session?.user?.id) return null
        const rawRole = (session.user as { role?: unknown }).role
        return {
            userId: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: typeof rawRole === 'number' ? rawRole : ROLES.USER
        }
    },
    async requireSession(event) {
        const user = await this.getSession(event)
        if (!user) {
            throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
        }
        return user
    }
}
