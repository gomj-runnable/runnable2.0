import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import handler from '../[...all]'

const { getAuthMode, fromWebHandler } = vi.hoisted(() => ({
    getAuthMode: vi.fn(),
    fromWebHandler: vi.fn()
}))
vi.mock('#server/security/auth/instance', () => ({ getAuthMode }))
vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()
    return { ...actual, fromWebHandler }
})

describe('AUTH /api/auth/[...all]', () => {
    const originalEnv = process.env.ENVIRONMENT_MODE

    beforeEach(() => {
        getAuthMode.mockReset()
        fromWebHandler.mockReset()
    })

    afterEach(() => {
        process.env.ENVIRONMENT_MODE = originalEnv
    })

    it('better-auth handler 결과를 그대로 반환', async () => {
        const fakeAuth = { handler: vi.fn() }
        getAuthMode.mockResolvedValue(fakeAuth)
        const innerHandler = vi.fn().mockResolvedValue({ ok: true })
        fromWebHandler.mockReturnValue(innerHandler)

        const event = { foo: 'bar' } as any
        const result = await handler(event)

        expect(fromWebHandler).toHaveBeenCalledWith(fakeAuth.handler)
        expect(innerHandler).toHaveBeenCalledWith(event)
        expect(result).toEqual({ ok: true })
    })

    it('일반 Error 는 500 으로 변환되고, 비-프로덕션에서는 메시지 노출', async () => {
        process.env.ENVIRONMENT_MODE = 'DEVELOP'
        getAuthMode.mockRejectedValue(new Error('SECRET LEAK'))

        await expect(handler({} as any)).rejects.toMatchObject({
            statusCode: 500,
            message: 'SECRET LEAK'
        })
    })

    it('production 환경에서는 일반 메시지로 마스킹', async () => {
        process.env.ENVIRONMENT_MODE = 'PRODUCT'
        getAuthMode.mockRejectedValue(new Error('SECRET LEAK'))

        await expect(handler({} as any)).rejects.toMatchObject({
            statusCode: 500,
            message: '인증 처리 중 오류가 발생했습니다.'
        })
    })

    it('non-Error throw 도 500 으로 변환', async () => {
        getAuthMode.mockRejectedValue('string-error')

        await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 500 })
    })
})
