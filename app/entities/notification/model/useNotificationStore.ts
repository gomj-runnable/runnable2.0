import { NotificationToneEnum } from '#shared/types/notification-tone.enum'

export interface NotificationOptions {
    /** 알림 제목 */
    title: string
    /** 알림 본문 메시지 */
    message: string
    /** 알림 색조 (기본: INFO) */
    tone?: NotificationToneEnum
}

/**
 * 앱 전역 알림 상태를 관리하는 store composable.
 * @example
 * ```ts
 * const notification = useNotificationStore()
 *
 * // 기본 정보 알림 (tone 생략 시 INFO)
 * notification.notify({ title: '저장 완료', message: '경로가 저장되었습니다.' })
 *
 * // 오류 알림
 * notification.notify({
 *     title: '경로정보 등록 실패',
 *     message: '경로정보 등록에 실패했습니다.',
 *     tone: NotificationToneEnum.ERROR
 * })
 * ```
 */
export const useNotificationStore = () => {
    const toast = useToast()

    /**
     * toast 알림을 표시한다.
     */
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
