import { describe, it, expect, vi } from 'vitest'
import {
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    internalError,
    withErrorHandler
} from '#server/errors'

describe('error factory functions', () => {
    it('badRequest 는 400 statusCode 를 가진 에러를 반환', () => {
        const e = badRequest('잘못')
        expect((e as any).statusCode).toBe(400)
        expect(e.message).toBe('잘못')
    })

    it('badRequest 기본 메시지', () => {
        const e = badRequest()
        expect(e.message).toBe('잘못된 요청입니다.')
    })

    it('unauthorized 는 401', () => {
        expect((unauthorized() as any).statusCode).toBe(401)
        expect((unauthorized('인증') as any).message).toBe('인증')
    })

    it('forbidden 는 403', () => {
        expect((forbidden() as any).statusCode).toBe(403)
    })

    it('notFound 는 404', () => {
        expect((notFound() as any).statusCode).toBe(404)
    })

    it('conflict 는 409', () => {
        expect((conflict() as any).statusCode).toBe(409)
    })

    it('internalError 는 500', () => {
        expect((internalError() as any).statusCode).toBe(500)
    })
})

vi.mock('h3', async (orig) => {
    const actual = await orig<typeof import('h3')>()
    return {
        ...actual,
        getRequestURL: (event: any) => new URL(event?.url ?? 'http://localhost/test')
    }
})

describe('withErrorHandler', () => {
    const makeEvent = (overrides: Record<string, unknown> = {}) =>
        ({ method: 'GET', path: '/x', url: 'http://localhost/x', ...overrides }) as any

    it('정상 결과를 그대로 전달', async () => {
        const wrapped = withErrorHandler(async () => ({ ok: true }))
        await expect(wrapped(makeEvent())).resolves.toEqual({ ok: true })
    })

    it('statusCode 를 가진 H3 에러는 그대로 전파', async () => {
        const e = badRequest('bad')
        const wrapped = withErrorHandler(async () => {
            throw e
        })
        await expect(wrapped(makeEvent())).rejects.toBe(e)
    })

    it('ZodError 는 400 으로 변환', async () => {
        const zodErr = new Error('schema fail')
        zodErr.name = 'ZodError'
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const wrapped = withErrorHandler(async () => {
            throw zodErr
        })
        try {
            await expect(wrapped(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
        } finally {
            warn.mockRestore()
        }
    })

    it('알 수 없는 에러는 500 으로 변환', async () => {
        const err = vi.spyOn(console, 'error').mockImplementation(() => {})
        const wrapped = withErrorHandler(async () => {
            throw new Error('boom')
        })
        try {
            await expect(wrapped(makeEvent())).rejects.toMatchObject({ statusCode: 500 })
        } finally {
            err.mockRestore()
        }
    })
})
