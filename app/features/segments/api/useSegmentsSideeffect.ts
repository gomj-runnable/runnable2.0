import type { SavedSegment, SegmentLeaderboard } from '#shared/types/segment'

/**
 * 세그먼트 부수효과 (#147).
 * 특정 경로의 세그먼트 목록 + 선택된 세그먼트의 리더보드 + effort 기록을 관리한다.
 */
export function useSegmentsSideeffect() {
    const routeId = useState<string | null>('segments-route-id', () => null)
    const segments = useState<SavedSegment[]>('segments-list', () => [])
    const isLoadingList = useState('segments-loading-list', () => false)
    const selectedSegmentId = useState<string | null>('segments-selected', () => null)
    const leaderboard = useState<SegmentLeaderboard | null>('segments-leaderboard', () => null)
    const isLoadingLeaderboard = useState('segments-loading-leaderboard', () => false)
    const isOpen = useState('segments-modal-open', () => false)

    const openForRoute = async (id: string) => {
        routeId.value = id
        isOpen.value = true
        selectedSegmentId.value = null
        leaderboard.value = null
        isLoadingList.value = true
        try {
            segments.value = await $fetch<SavedSegment[]>('/api/segments', {
                query: { routeId: id }
            })
        } catch {
            segments.value = []
        } finally {
            isLoadingList.value = false
        }
    }

    const selectSegment = async (segmentId: string) => {
        if (selectedSegmentId.value === segmentId) {
            selectedSegmentId.value = null
            leaderboard.value = null
            return
        }
        selectedSegmentId.value = segmentId
        isLoadingLeaderboard.value = true
        try {
            leaderboard.value = await $fetch<SegmentLeaderboard>(
                `/api/segments/${segmentId}/leaderboard`
            )
        } catch {
            leaderboard.value = null
        } finally {
            isLoadingLeaderboard.value = false
        }
    }

    const recordEffort = async (
        segmentId: string,
        input: { durationSec: number; paceSecPerKm: number }
    ) => {
        await $fetch(`/api/segments/${segmentId}/efforts`, {
            method: 'POST',
            body: input
        })
        if (selectedSegmentId.value === segmentId) {
            leaderboard.value = await $fetch<SegmentLeaderboard>(
                `/api/segments/${segmentId}/leaderboard`
            )
        }
    }

    const close = () => {
        isOpen.value = false
    }

    return {
        routeId,
        segments,
        isLoadingList,
        selectedSegmentId,
        leaderboard,
        isLoadingLeaderboard,
        isOpen,
        openForRoute,
        selectSegment,
        recordEffort,
        close
    }
}
