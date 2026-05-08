import { describe, it, expect, beforeEach, vi } from 'vitest'

async function freshModule() {
    vi.resetModules()
    vi.stubEnv('ADMIN_SEED_PASSWORD', 'admin1234')
    vi.stubEnv('DEVELOPER_SEED_PASSWORD', 'developer1234')
    return import('../memoryStore')
}

describe('memoryStore - 시드 사용자', () => {
    beforeEach(() => {
        vi.unstubAllEnvs()
    })

    it('MEMORY_AUTO_LOGIN_EMAIL 상수는 admin@runnable.com 이다', async () => {
        const mod = await freshModule()
        expect(mod.MEMORY_AUTO_LOGIN_EMAIL).toBe('admin@runnable.com')
    })

    it('자동 로그인 계정은 admin@runnable.com 이며 ADMIN role 을 갖는다', async () => {
        const mod = await freshModule()
        const user = mod.memoryUsers.get('admin@runnable.com')
        expect(user).toBeDefined()
        expect(user?.id).toBe('admin-role-user')
        expect(user?.password).toBe('admin1234')
    })

    it('dev 시드 계정은 ADMIN_SEED_PASSWORD 환경변수 값을 사용한다', async () => {
        const mod = await freshModule()
        const user = mod.memoryUsers.get('dev@localhost')
        expect(user).toBeDefined()
        expect(user?.password).toBe('admin1234')
    })

    it('memorySessions 와 memoryRouteInfos 가 빈 상태로 초기화되어 있다', async () => {
        const mod = await freshModule()
        expect(mod.memorySessions.size).toBe(0)
        expect(mod.memoryRouteInfos).toEqual([])
    })
})
