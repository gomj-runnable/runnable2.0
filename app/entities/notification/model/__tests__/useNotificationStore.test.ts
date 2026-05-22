import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'

const toastAdd = vi.fn()
vi.stubGlobal('useToast', () => ({ add: toastAdd }))

describe('useNotificationStore', () => {
    beforeEach(() => {
        toastAdd.mockReset()
    })

    it('notify — toast.add 호출 + tone 기본 INFO', () => {
        const { notify } = useNotificationStore()
        notify({ title: '제목', message: '본문' })
        expect(toastAdd).toHaveBeenCalledOnce()
        const call = toastAdd.mock.calls[0]![0]!
        expect(call.title).toBe('제목')
        expect(call.description).toBe('본문')
        expect(call.icon).toBe(NotificationToneEnum.INFO.icon)
    })

    it('tone 지정 — 해당 tone 의 icon/color 사용', () => {
        const { notify } = useNotificationStore()
        notify({ title: 'x', message: 'y', tone: NotificationToneEnum.ERROR })
        expect(toastAdd.mock.calls[0]![0]!.icon).toBe(NotificationToneEnum.ERROR.icon)
    })
})
