import { describe, it, expect, vi, beforeEach } from 'vitest'

import { withAuth } from '../withAuth'
import { authService } from '../../utils/auth.service'

vi.mock('../../utils/auth.service', () => ({
    authService: {
        getSession: vi.fn(),
        requireSession: vi.fn()
    }
}))

describe('withAuth', () => {
    const event = { context: {} } as any
    const fakeUser = { userId: 'u1', name: 'n', email: 'e', role: 1 }

    beforeEach(() => vi.clearAllMocks())

    it('인증 성공 시 user 를 콜백과 event.context 에 주입', async () => {
        vi.mocked(authService.requireSession).mockResolvedValue(fakeUser)
        const handler = vi.fn().mockResolvedValue('ok')
        const wrapped = withAuth(handler)
        await expect(wrapped(event)).resolves.toBe('ok')
        expect(handler).toHaveBeenCalledWith(event, fakeUser)
        expect(event.context.user).toBe(fakeUser)
    })

    it('requireSession 이 throw 하면 핸들러 미호출', async () => {
        const err = new Error('401')
        vi.mocked(authService.requireSession).mockRejectedValue(err)
        const handler = vi.fn()
        const wrapped = withAuth(handler)
        await expect(wrapped(event)).rejects.toBe(err)
        expect(handler).not.toHaveBeenCalled()
    })
})
