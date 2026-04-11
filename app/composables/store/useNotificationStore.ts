/**
 * 앱 전역 알림 상태를 관리하는 store composable.
 * 어디서든 `useNotificationStore().notify()`를 호출하면 NotificationModal이 표시된다.
 * alert() 대신 사용하여 일관된 UI를 제공한다.
 */

export type NotificationTone = 'success' | 'error' | 'info' | 'warning'

export interface NotificationOptions {
    /** 알림 제목 */
    title: string
    /** 알림 본문 메시지 */
    message: string
    /** 알림 색조 (기본: 'info') */
    tone?: NotificationTone
}

export const useNotificationStore = () => {
    const isOpen = useState('notification-open', () => false)
    const title = useState('notification-title', () => '')
    const message = useState('notification-message', () => '')
    const tone = useState<NotificationTone>('notification-tone', () => 'info')

    /** 알림 모달을 표시한다. */
    const notify = (options: NotificationOptions) => {
        title.value = options.title
        message.value = options.message
        tone.value = options.tone ?? 'info'
        isOpen.value = true
    }

    /** 알림 모달을 닫는다. */
    const close = () => {
        isOpen.value = false
    }

    return { isOpen, title, message, tone, notify, close }
}
