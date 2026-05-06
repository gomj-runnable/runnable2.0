import { NotificationToneEnum } from '#shared/types/notification-tone.enum'
import { useNotificationStore } from '../model/useNotificationStore'

interface ExceptionHandlerOptions {
    /** 에러 알림에 표시할 제목 (기본: '오류') */
    title?: string
    /** 사용자에게 표시할 기본 메시지 (서버 메시지가 없을 때) */
    fallbackMessage?: string
    /** 에러 발생 시에도 반환할 기본값 (없으면 throw) */
    fallback?: unknown
    /** 알림 표시 여부 (기본: true) */
    notify?: boolean
}

/**
 * API 호출 등 비동기 작업의 에러를 일관되게 처리하는 composable.
 * 사용자 친화적 알림 + 에러 로깅을 통합한다.
 *
 * withErrorBoundary와의 차이:
 * - withErrorBoundary: 재시도 + 폴백 (네트워크 레벨)
 * - useExceptionHandler: 사용자 알림 + 에러 분류 (UX 레벨)
 *
 * 사용 예:
 *   const { handleAsync } = useExceptionHandler()
 *
 *   // 기본: 에러 시 toast 알림 + throw
 *   const result = await handleAsync(() => $fetch('/api/routes'))
 *
 *   // 폴백: 에러 시 빈 배열 반환 + toast 알림
 *   const routes = await handleAsync(
 *       () => $fetch<SavedRoute[]>('/api/routes'),
 *       { fallback: [], title: '경로 로드 실패' }
 *   )
 *
 *   // 알림 없이 조용히 처리
 *   const data = await handleAsync(fn, { notify: false, fallback: null })
 */
export function useExceptionHandler() {
    const { notify } = useNotificationStore()

    /** $fetch 에러에서 사용자 친화적 메시지를 추출한다. */
    function extractMessage(error: unknown, fallbackMessage: string): string {
        if (error instanceof Error) {
            // Nuxt $fetch 에러 — statusMessage 또는 data.message 활용
            const fetchError = error as Error & {
                statusCode?: number
                statusMessage?: string
                data?: { message?: string }
            }

            if (fetchError.data?.message) return fetchError.data.message
            if (fetchError.statusMessage) return fetchError.statusMessage

            // 네트워크 에러
            if (error.message === 'Failed to fetch' || error.message.includes('fetch'))
                return '네트워크 연결을 확인해 주세요.'
        }

        return fallbackMessage
    }

    /** 에러의 HTTP 상태 코드를 추출한다 (없으면 500). */
    function extractStatusCode(error: unknown): number {
        if (error instanceof Error && 'statusCode' in error) {
            return (error as Error & { statusCode: number }).statusCode
        }
        return 500
    }

    /** 상태 코드에 맞는 알림 톤을 반환한다. */
    function toneFromStatus(statusCode: number): NotificationToneEnum {
        if (statusCode >= 400 && statusCode < 500) return NotificationToneEnum.WARNING
        return NotificationToneEnum.ERROR
    }

    /** 비동기 함수를 실행하고, 실패 시 알림 + 폴백/throw 처리한다. */
    async function handleAsync<T>(
        fn: () => Promise<T>,
        options: ExceptionHandlerOptions = {}
    ): Promise<T> {
        const {
            title = '오류',
            fallbackMessage = '요청을 처리하지 못했습니다.',
            fallback,
            notify: shouldNotify = true
        } = options

        try {
            return await fn()
        } catch (error) {
            const statusCode = extractStatusCode(error)
            const message = extractMessage(error, fallbackMessage)

            console.error(`[ExceptionHandler] ${statusCode}:`, error)

            if (shouldNotify) {
                notify({
                    title,
                    message,
                    tone: toneFromStatus(statusCode)
                })
            }

            if (fallback !== undefined) {
                return fallback as T
            }

            throw error
        }
    }

    return { handleAsync, extractMessage, extractStatusCode }
}
