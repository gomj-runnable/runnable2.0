import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ROLES } from '#shared/constants/roles'

import { withAdmin } from '../withAdmin'
import { auth } from '../../security/auth/service'

vi.mock('../../security/auth/service', () => ({
    auth: {
        getSession: vi.fn(),
        requireSession: vi.fn()
    }
}))

describe('withAdmin', () => {
    const event = { context: {} } as any

    beforeEach(() => {
        vi.clearAllMocks()
        event.context = {}
    })

    it('ADMIN 권한 통과 + user 주입', async () => {
        const admin = { userId: 'a', name: 'A', email: 'a@x', role: ROLES.ADMIN }
        vi.mocked(auth.requireSession).mockResolvedValue(admin)
        const handler = vi.fn().mockResolvedValue('ok')
        const wrapped = withAdmin(handler)
        await expect(wrapped(event)).resolves.toBe('ok')
        expect(handler).toHaveBeenCalledWith(event, admin)
        expect(event.context.user).toBe(admin)
    })

    it('USER 권한이면 403', async () => {
        const user = { userId: 'u', name: 'U', email: 'u@x', role: ROLES.USER }
        vi.mocked(auth.requireSession).mockResolvedValue(user)
        const handler = vi.fn()
        const wrapped = withAdmin(handler)
        await expect(wrapped(event)).rejects.toMatchObject({ statusCode: 403 })
        expect(handler).not.toHaveBeenCalled()
    })

    it('세션 없으면 requireSession 에러 그대로 전파', async () => {
        const err = new Error('401')
        vi.mocked(auth.requireSession).mockRejectedValue(err)
        const wrapped = withAdmin(vi.fn())
        await expect(wrapped(event)).rejects.toBe(err)
    })
})
