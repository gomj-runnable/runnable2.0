import { NotificationToneEnum } from '#shared/types/notification-tone.enum'
import type { useNotificationStore } from '~/entities/notification/model/useNotificationStore'

type Notification = ReturnType<typeof useNotificationStore>

/**
 * 경로 카드의 공유/좋아요 부수효과.
 * - 공유: 공개 경로의 share URL 을 클립보드에 복사
 * - 좋아요: POST/DELETE /api/routes/[routeId]/like 호출. likedRouteIds 로 토글 상태 관리
 */
export function useRouteSocialActions(notification: Notification) {
    const likedRouteIds = useState<Set<string>>('route-liked-ids', () => new Set())
    const likeCounts = useState<Record<string, number>>('route-like-counts', () => ({}))

    const copyShareLink = async (routeId: string) => {
        try {
            const url = `${window.location.origin}/share/${routeId}`
            await navigator.clipboard.writeText(url)
            notification.notify({
                title: '공유 링크 복사됨',
                message: url,
                tone: NotificationToneEnum.SUCCESS
            })
        } catch {
            notification.notify({
                title: '공유 링크 복사 실패',
                message: '클립보드 접근이 차단되었습니다.',
                tone: NotificationToneEnum.ERROR
            })
        }
    }

    const toggleLike = async (routeId: string, initialCount = 0) => {
        const wasLiked = likedRouteIds.value.has(routeId)
        const baseCount = likeCounts.value[routeId] ?? initialCount

        likedRouteIds.value = new Set(likedRouteIds.value)
        if (wasLiked) likedRouteIds.value.delete(routeId)
        else likedRouteIds.value.add(routeId)
        likeCounts.value = {
            ...likeCounts.value,
            [routeId]: Math.max(0, baseCount + (wasLiked ? -1 : 1))
        }

        try {
            await $fetch(`/api/routes/${routeId}/like`, {
                method: wasLiked ? 'DELETE' : 'POST'
            })
        } catch (err: unknown) {
            likedRouteIds.value = new Set(likedRouteIds.value)
            if (wasLiked) likedRouteIds.value.add(routeId)
            else likedRouteIds.value.delete(routeId)
            likeCounts.value = { ...likeCounts.value, [routeId]: baseCount }

            const message =
                err && typeof err === 'object' && 'statusMessage' in err
                    ? String((err as { statusMessage?: unknown }).statusMessage ?? '')
                    : ''
            notification.notify({
                title: '좋아요 처리 실패',
                message: message || '잠시 후 다시 시도해주세요.',
                tone: NotificationToneEnum.ERROR
            })
        }
    }

    const isLiked = (routeId: string) => likedRouteIds.value.has(routeId)
    const displayLikeCount = (routeId: string, initialCount = 0) =>
        likeCounts.value[routeId] ?? initialCount

    return { copyShareLink, toggleLike, isLiked, displayLikeCount }
}
