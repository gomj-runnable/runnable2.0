import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withErrorBoundary } from '~/shared/lib/useAsyncDecorator'

describe('withErrorBoundary()', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    it('성공 시 결과 그대로 반환', async () => {
        const wrapped = withErrorBoundary(async (x: number) => x * 2, { label: 'T' })
        await expect(wrapped(5)).resolves.toBe(10)
    })

    it('실패 + fallback 지정 시 fallback 반환', async () => {
        const wrapped = withErrorBoundary(
            async () => {
                throw new Error('boom')
            },
            { label: 'T', fallback: 'safe' }
        )
        await expect(wrapped()).resolves.toBe('safe')
    })

    it('실패 + fallback 없으면 throw', async () => {
        const wrapped = withErrorBoundary(
            async () => {
                throw new Error('boom')
            },
            { label: 'T' }
        )
        await expect(wrapped()).rejects.toThrow('boom')
    })

    it('retry 옵션 — 실패 후 재시도 (3회 후 fallback)', async () => {
        let attempts = 0
        const wrapped = withErrorBoundary(
            async () => {
                attempts++
                throw new Error('boom')
            },
            { label: 'T', retry: 2, retryDelay: 1, fallback: 'safe' }
        )
        await expect(wrapped()).resolves.toBe('safe')
        expect(attempts).toBe(3) // 초기 1회 + retry 2회
    })

    it('첫 시도 성공 시 재시도 안 함', async () => {
        let attempts = 0
        const wrapped = withErrorBoundary(
            async () => {
                attempts++
                return 'ok'
            },
            { label: 'T', retry: 5 }
        )
        await wrapped()
        expect(attempts).toBe(1)
    })

    it('object fallback 은 structuredClone 으로 deep copy', async () => {
        const fallback = { items: [1, 2, 3] }
        const wrapped = withErrorBoundary(
            async () => {
                throw new Error('boom')
            },
            { label: 'T', fallback }
        )
        const result = (await wrapped()) as typeof fallback
        expect(result).toEqual(fallback)
        // structuredClone 이므로 원본과 다른 참조
        expect(result).not.toBe(fallback)
    })
})
