import { describe, it, expect, vi, beforeEach } from 'vitest'

import handler from '../optimize.post'

const { getRoutingService, requireSession } = vi.hoisted(() => ({
    getRoutingService: vi.fn(),
    requireSession: vi.fn()
}))
vi.mock('../../../utils/routing/registry', () => ({ getRoutingService }))
vi.mock('../../../utils/auth.service', () => ({
    authService: { requireSession }
}))

const makeEvent = (body: unknown) => ({ context: {}, body }) as any

const validBody = {
    positions: [
        [126.97, 37.56, 0],
        [127.0, 37.6, 0]
    ],
    mode: 'TMAP'
}

describe('POST /api/routes/optimize', () => {
    beforeEach(() => {
        getRoutingService.mockReset()
        requireSession.mockReset().mockResolvedValue({ userId: 'u-1' })
    })

    it('세션이 없으면 401', async () => {
        requireSession.mockRejectedValue(
            Object.assign(new Error('Unauthorized'), { statusCode: 401 })
        )

        await expect(handler(makeEvent(validBody))).rejects.toMatchObject({ statusCode: 401 })
    })

    it('서비스가 없으면 fallback 응답 (지원하지 않는 모드 메시지)', async () => {
        getRoutingService.mockReturnValue(null)

        const result = await handler(makeEvent(validBody))

        expect(result.optimized).toBe(false)
        expect(result.message).toContain('지원하지 않습니다')
        expect(result.positions).toEqual(validBody.positions)
        expect(result.mode).toBe('TMAP')
    })

    it('서비스가 isAvailable=false 면 fallback (사용할 수 없습니다 메시지)', async () => {
        getRoutingService.mockReturnValue({
            isAvailable: () => false,
            optimize: vi.fn()
        })

        const result = await handler(makeEvent(validBody))

        expect(result.optimized).toBe(false)
        expect(result.message).toContain('사용할 수 없습니다')
    })

    it('서비스 optimize 가 성공하면 optimized=true 응답', async () => {
        const optimized = [
            [126.97, 37.56, 0],
            [126.98, 37.58, 0],
            [127.0, 37.6, 0]
        ]
        const optimize = vi.fn().mockResolvedValue(optimized)
        getRoutingService.mockReturnValue({ isAvailable: () => true, optimize })

        const result = await handler(makeEvent(validBody))

        expect(optimize).toHaveBeenCalledWith(validBody.positions)
        expect(result.optimized).toBe(true)
        expect(result.positions).toEqual(optimized)
    })

    it('서비스 optimize 가 throw 하면 에러 메시지가 담긴 fallback', async () => {
        const optimize = vi.fn().mockRejectedValue(new Error('upstream timeout'))
        getRoutingService.mockReturnValue({ isAvailable: () => true, optimize })

        const result = await handler(makeEvent(validBody))

        expect(result.optimized).toBe(false)
        expect(result.message).toBe('upstream timeout')
    })

    it('non-Error throw 는 기본 메시지로 fallback', async () => {
        const optimize = vi.fn().mockRejectedValue('string-error')
        getRoutingService.mockReturnValue({ isAvailable: () => true, optimize })

        const result = await handler(makeEvent(validBody))

        expect(result.optimized).toBe(false)
        expect(result.message).toContain('오류가 발생했습니다')
    })
})
