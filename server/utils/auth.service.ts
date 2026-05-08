import type { H3Event } from 'h3'
import { getAuthInstance } from './auth'

export interface SessionUser {
    userId: string
    name: string
    email: string
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
        return {
            userId: session.user.id,
            name: session.user.name,
            email: session.user.email
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
