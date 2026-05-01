import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import type { betterAuth } from 'better-auth'
import { memoryUsers, memorySessions } from './memoryStore'

export interface SessionUser {
    userId: string
    name: string
    email: string
}

export interface IAuthService {
    getSession(event: H3Event): Promise<SessionUser | null>
    requireSession(event: H3Event): Promise<SessionUser>
}

type BetterAuthInstance = ReturnType<typeof betterAuth>

class MemoryAuthService implements IAuthService {
    async getSession(event: H3Event): Promise<SessionUser | null> {
        const token = getCookie(event, 'better-auth.session_token')
        if (token) {
            const userId = memorySessions.get(token)
            const user = userId
                ? Array.from(memoryUsers.values()).find((u) => u.id === userId)
                : null
            if (user) {
                return { userId: user.id, name: user.name, email: user.email }
            }
        }
        return null
    }

    async requireSession(event: H3Event): Promise<SessionUser> {
        const user = await this.getSession(event)
        if (!user) {
            throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
        }
        return user
    }
}

class BetterAuthService implements IAuthService {
    private auth: BetterAuthInstance

    constructor(auth: BetterAuthInstance) {
        this.auth = auth
    }

    async getSession(event: H3Event): Promise<SessionUser | null> {
        const session = await this.auth.api.getSession({ headers: event.headers })
        if (!session?.user?.id) return null
        return {
            userId: session.user.id,
            name: session.user.name,
            email: session.user.email
        }
    }

    async requireSession(event: H3Event): Promise<SessionUser> {
        const user = await this.getSession(event)
        if (!user) {
            throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
        }
        return user
    }
}

export function createAuthService(auth: BetterAuthInstance | null): IAuthService {
    if (!auth) {
        return new MemoryAuthService()
    }
    return new BetterAuthService(auth)
}
