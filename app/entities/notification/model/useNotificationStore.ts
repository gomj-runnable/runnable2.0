/**
 * 앱 전역 알림 상태를 관리하는 store composable.
 * 어디서든 `useNotificationStore().notify()`를 호출하면 toast 알림이 표시된다.
 */
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'

export interface NotificationOptions {
    /** 알림 제목 */
    title: string
    /** 알림 본문 메시지 */
    message: string
    /** 알림 색조 (기본: INFO) */
    tone?: NotificationToneEnum
}

export const useNotificationStore = () => {
    const toast = useToast()

    /** toast 알림을 표시한다. */
    const notify = (options: NotificationOptions) => {
        const tone = options.tone ?? NotificationToneEnum.INFO
        toast.add({
            title: options.title,
            description: options.message,
            icon: tone.icon,
            color: tone.color as 'info' | 'success' | 'error' | 'warning' | 'neutral'
        })
    }

    return { notify }
}
