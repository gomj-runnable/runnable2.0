import type { ShallowRef } from 'vue'
import type { SavedFeedback, FeedbackDraftInput } from '#shared/types/feedback'
import type { CesiumViewer, CesiumEntity } from '~/composables/useWindow'
import { useFeedbackStore } from '~/composables/store/useFeedbackStore'

/**
 * 피드백 데이터 페칭과 Cesium 마커 렌더링을 담당하는 sideeffect.
 * useFeedbackStore를 구독하여 피드백 마커를 지도에 동기화한다.
 */
export const useFeedbackSideeffect = (viewer: ShallowRef<CesiumViewer | null>) => {
    const store = useFeedbackStore()
    let entityGroup: ReturnType<typeof createEntityGroup> | null = null

    /** 특정 경로의 피드백 목록을 서버에서 불러온다 */
    const fetchFeedbacks = async (routeId: string) => {
        store.isLoading.value = true
        try {
            const data = await $fetch<SavedFeedback[]>(`/api/routes/${routeId}/feedbacks`)
            store.feedbacks.value = data
        } catch (e) {
            console.error('[FeedbackSideeffect] 피드백 조회 실패:', e)
        } finally {
            store.isLoading.value = false
        }
    }

    /** 새 피드백을 서버에 전송한다 */
    const submitFeedback = async (routeId: string, input: FeedbackDraftInput) => {
        try {
            const feedback = await $fetch<SavedFeedback>(`/api/routes/${routeId}/feedbacks`, {
                method: 'POST',
                body: input
            })
            store.feedbacks.value = [...store.feedbacks.value, feedback]
            store.isAddingFeedback.value = false
            return feedback
        } catch (e) {
            console.error('[FeedbackSideeffect] 피드백 등록 실패:', e)
            throw e
        }
    }

    /** 피드백 마커를 Cesium 지도에 렌더링한다 */
    const renderFeedbackMarkers = () => {
        const v = viewer.value
        const C = window.Cesium
        if (!v || !C) return

        // 기존 마커 제거
        clearMarkers()

        entityGroup = createEntityGroup(v)

        for (const fb of store.feedbacks.value) {
            const position = C.Cartesian3.fromDegrees(
                Number(fb.longitude),
                Number(fb.latitude),
                fb.elevation != null ? Number(fb.elevation) + 2 : undefined
            )

            entityGroup.add({
                position,
                billboard: {
                    image: '/images/feedback-pin.png',
                    width: 24,
                    height: 32,
                    verticalOrigin: C.VerticalOrigin.BOTTOM,
                    heightReference: C.HeightReference.CLAMP_TO_GROUND
                },
                label: {
                    text: fb.content.length > 20 ? `${fb.content.slice(0, 20)}...` : fb.content,
                    font: '12px sans-serif',
                    style: C.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    outlineColor: C.Color.BLACK,
                    fillColor: C.Color.WHITE,
                    verticalOrigin: C.VerticalOrigin.BOTTOM,
                    pixelOffset: new C.Cartesian2(0, -36),
                    heightReference: C.HeightReference.CLAMP_TO_GROUND,
                    showBackground: true,
                    backgroundColor: new C.Color(0.165, 0.165, 0.165, 0.8)
                },
                properties: {
                    feedbackId: fb.feedbackId,
                    type: 'feedback'
                }
            })
        }
    }

    /** 모든 피드백 마커를 제거한다 */
    const clearMarkers = () => {
        if (entityGroup) {
            entityGroup.removeAll()
            entityGroup = null
        }
    }

    // 피드백 목록 변경 시 마커 재렌더링
    watch(() => store.feedbacks.value, () => {
        renderFeedbackMarkers()
    }, { deep: true })

    return {
        fetchFeedbacks,
        submitFeedback,
        renderFeedbackMarkers,
        clearMarkers
    }
}

/** Cesium entity 그룹을 생성하여 일괄 관리한다 */
function createEntityGroup(viewer: CesiumViewer) {
    const entities: CesiumEntity[] = []

    return {
        add(options: Record<string, unknown>) {
            const entity = viewer.entities.add(options)
            entities.push(entity)
            return entity
        },
        removeAll() {
            for (const entity of entities) {
                viewer.entities.remove(entity)
            }
            entities.length = 0
        }
    }
}
