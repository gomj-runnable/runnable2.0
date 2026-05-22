import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useExceptionHandler } from '~/entities/notification/lib/useExceptionHandler'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'

const toastAdd = vi.fn()
vi.stubGlobal('useToast', () => ({ add: toastAdd }))

describe('useExceptionHandler', () => {
    beforeEach(() => {
        toastAdd.mockReset()
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    describe('extractStatusCode', () => {
        it('Error.statusCode 가 있으면 그 값', () => {
            const { extractStatusCode } = useExceptionHandler()
            const e = Object.assign(new Error('x'), { statusCode: 404 })
            expect(extractStatusCode(e)).toBe(404)
        })

        it('없으면 500', () => {
            const { extractStatusCode } = useExceptionHandler()
            expect(extractStatusCode(new Error('x'))).toBe(500)
            expect(extractStatusCode('not an error')).toBe(500)
        })
    })

    describe('extractMessage', () => {
        it('data.message 가 있으면 그 메시지', () => {
            const { extractMessage } = useExceptionHandler()
            const e = Object.assign(new Error('orig'), {
                data: { message: 'server says no' }
            })
            expect(extractMessage(e, 'fallback')).toBe('server says no')
        })

        it('statusMessage fallback', () => {
            const { extractMessage } = useExceptionHandler()
            const e = Object.assign(new Error('orig'), { statusMessage: 'Bad Request' })
            expect(extractMessage(e, 'fallback')).toBe('Bad Request')
        })

        it('"Failed to fetch" → 네트워크 메시지', () => {
            const { extractMessage } = useExceptionHandler()
            const e = new Error('Failed to fetch')
            expect(extractMessage(e, 'fallback')).toContain('네트워크')
        })

        it('message 가 "fetch" 를 포함하면 네트워크 메시지', () => {
            const { extractMessage } = useExceptionHandler()
            const e = new Error('cors fetch error')
            expect(extractMessage(e, 'fallback')).toContain('네트워크')
        })

        it('알 수 없는 에러 → fallback', () => {
            const { extractMessage } = useExceptionHandler()
            expect(extractMessage(null, 'default')).toBe('default')
        })
    })

    describe('handleAsync', () => {
        it('성공 — fn 결과 반환, 알림 없음', async () => {
            const { handleAsync } = useExceptionHandler()
            const result = await handleAsync(async () => 42)
            expect(result).toBe(42)
            expect(toastAdd).not.toHaveBeenCalled()
        })

        it('실패 + notify=true → toast 알림 호출 + throw', async () => {
            const { handleAsync } = useExceptionHandler()
            const err = Object.assign(new Error('e'), { statusCode: 404 })
            await expect(handleAsync(async () => Promise.reject(err))).rejects.toBe(err)
            expect(toastAdd).toHaveBeenCalledOnce()
            expect(toastAdd.mock.calls[0]![0]!.title).toBe('오류')
        })

        it('fallback 제공 시 throw 대신 fallback 반환', async () => {
            const { handleAsync } = useExceptionHandler()
            const result = await handleAsync(
                async () => {
                    throw new Error('fail')
                },
                { fallback: 'safe' }
            )
            expect(result).toBe('safe')
            expect(toastAdd).toHaveBeenCalledOnce()
        })

        it('notify=false → toast 호출 안함', async () => {
            const { handleAsync } = useExceptionHandler()
            await expect(
                handleAsync(
                    async () => {
                        throw new Error('fail')
                    },
                    { notify: false, fallback: null }
                )
            ).resolves.toBeNull()
            expect(toastAdd).not.toHaveBeenCalled()
        })

        it('4xx → WARNING tone, 5xx → ERROR tone', async () => {
            const { handleAsync } = useExceptionHandler()

            const e1 = Object.assign(new Error('x'), { statusCode: 400 })
            await handleAsync(async () => Promise.reject(e1), { fallback: null })
            expect(toastAdd.mock.calls.at(-1)![0]!.icon).toBe(NotificationToneEnum.WARNING.icon)

            const e2 = Object.assign(new Error('x'), { statusCode: 500 })
            await handleAsync(async () => Promise.reject(e2), { fallback: null })
            expect(toastAdd.mock.calls.at(-1)![0]!.icon).toBe(NotificationToneEnum.ERROR.icon)
        })
    })
})
