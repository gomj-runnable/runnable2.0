import type { ShallowRef } from 'vue'
import type { SavedFeedback, FeedbackDraftInput } from '#shared/types/feedback'
import type { CesiumViewer, CesiumEntity } from '~/composables/useWindow'
import { useFeedbackStore } from '~/composables/store/useFeedbackStore'

export interface FeedbackClickedPosition {
    longitude: number
    latitude: number
    elevation?: number
}

/**
 * 피드백 데이터 페칭, Cesium 마커 렌더링, 지도 클릭 핸들링을 담당하는 sideeffect.
 * 서버 저장된 피드백과 로컬 미저장 피드백 모두 지도에 표시한다.
 */
export const useFeedbackSideeffect = (viewer: ShallowRef<CesiumViewer | null>) => {
    const store = useFeedbackStore()
    let entityGroup: ReturnType<typeof createEntityGroup> | null = null
    const entityToFeedbackMap = new Map<CesiumEntity, SavedFeedback | FeedbackDraftInput>()

    /** 지도 클릭으로 선택된 피드백 위치 */
    const clickedPosition = ref<FeedbackClickedPosition | null>(null)
    let addClickHandler: import('cesium').ScreenSpaceEventHandler | null = null
    let markerClickHandler: import('cesium').ScreenSpaceEventHandler | null = null

    // ─── 지도 클릭: 피드백 추가 모드 ─────────────────────────────

    watch(
        () => store.isAddingFeedback.value,
        (isAdding) => {
            addClickHandler?.destroy()
            addClickHandler = null
            clickedPosition.value = null

            if (!isAdding) return

            const v = viewer.value
            const C = window.Cesium
            if (!v || !C) return

            const handler = new C.ScreenSpaceEventHandler(v.scene.canvas)

            handler.setInputAction((movement: { position: unknown }) => {
                const scene = (v as unknown as { scene: import('cesium').Scene }).scene
                let cartesian: import('cesium').Cartesian3 | undefined

                if (scene.pickPositionSupported) {
                    const picked = scene.pickPosition(movement.position as import('cesium').Cartesian2)
                    if (C.defined(picked)) cartesian = picked
                }

                if (!cartesian) {
                    const ray = (v as unknown as { camera: import('cesium').Camera }).camera.getPickRay(
                        movement.position as import('cesium').Cartesian2
                    )
                    if (ray) {
                        const globePick = scene.globe?.pick(ray, scene)
                        if (C.defined(globePick)) cartesian = globePick
                    }
                }

                if (!cartesian) return

                const carto = C.Cartographic.fromCartesian(cartesian)
                clickedPosition.value = {
                    longitude: C.Math.toDegrees(carto.longitude),
                    latitude: C.Math.toDegrees(carto.latitude),
                    elevation: carto.height > 0 ? carto.height : undefined
                }
            }, C.ScreenSpaceEventType.LEFT_CLICK)

            addClickHandler = handler
        }
    )

    const cancelAdding = () => {
        store.isAddingFeedback.value = false
        clickedPosition.value = null
    }

    // ─── 마커 클릭: 팝업 표시 ────────────────────────────────────

    watch(
        viewer,
        (v) => {
            markerClickHandler?.destroy()
            markerClickHandler = null

            if (!v) return

            const C = window.Cesium
            if (!C) return

            const handler = new C.ScreenSpaceEventHandler(v.scene.canvas)

            handler.setInputAction((movement: { position: unknown }) => {
                if (store.isAddingFeedback.value) return

                const picked = v.scene.pick(movement.position as import('cesium').Cartesian2)
                if (!picked?.id) {
                    store.selectedMarkerFeedback.value = null
                    return
                }

                const fb = entityToFeedbackMap.get(picked.id as CesiumEntity)
                if (fb) {
                    store.selectedMarkerFeedback.value = fb
                } else {
                    store.selectedMarkerFeedback.value = null
                }
            }, C.ScreenSpaceEventType.LEFT_CLICK)

            markerClickHandler = handler
        },
        { immediate: true }
    )

    // ─── 서버 API ────────────────────────────────────────────────

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

    /** 로컬 피드백을 서버에 일괄 저장한다 */
    const saveLocalFeedbacks = async (routeId: string) => {
        const locals = store.localFeedbacks.value
        if (!locals.length) return

        for (const input of locals) {
            try {
                const feedback = await $fetch<SavedFeedback>(`/api/routes/${routeId}/feedbacks`, {
                    method: 'POST',
                    body: input
                })
                store.feedbacks.value = [...store.feedbacks.value, feedback]
            } catch (e) {
                console.error('[FeedbackSideeffect] 피드백 일괄 저장 실패:', e)
            }
        }
        store.clearLocalFeedbacks()
    }

    /** 새 피드백을 서버에 즉시 전송한다 (저장된 경로에서 ChipButton으로 추가 시) */
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

    // ─── 마커 렌더링 ─────────────────────────────────────────────

    const renderFeedbackMarkers = () => {
        const v = viewer.value
        const C = window.Cesium
        if (!v || !C) return

        clearMarkers()
        entityGroup = createEntityGroup(v)
        entityToFeedbackMap.clear()

        const allFeedbacks: (SavedFeedback | FeedbackDraftInput)[] = [
            ...store.feedbacks.value,
            ...store.localFeedbacks.value
        ]

        for (const fb of allFeedbacks) {
            const position = C.Cartesian3.fromDegrees(
                Number(fb.longitude),
                Number(fb.latitude),
                fb.elevation != null ? Number(fb.elevation) + 2 : undefined
            )

            const entity = entityGroup.add({
                position,
                point: {
                    pixelSize: 10,
                    color: C.Color.YELLOW,
                    outlineColor: C.Color.BLACK,
                    outlineWidth: 2,
                    heightReference: C.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                label: {
                    text: fb.name,
                    font: '13px sans-serif',
                    style: C.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    outlineColor: C.Color.BLACK,
                    fillColor: C.Color.WHITE,
                    verticalOrigin: C.VerticalOrigin.BOTTOM,
                    pixelOffset: new C.Cartesian2(0, -12),
                    heightReference: C.HeightReference.CLAMP_TO_GROUND,
                    showBackground: true,
                    backgroundColor: new C.Color(0.165, 0.165, 0.165, 0.8)
                },
                properties: {
                    type: 'feedback'
                }
            })

            entityToFeedbackMap.set(entity, fb)
        }
    }

    const clearMarkers = () => {
        if (entityGroup) {
            entityGroup.removeAll()
            entityGroup = null
        }
        entityToFeedbackMap.clear()
    }

    // 피드백 목록 또는 로컬 피드백 변경 시 마커 재렌더링
    watch(
        [() => store.feedbacks.value, () => store.localFeedbacks.value],
        () => renderFeedbackMarkers(),
        { deep: true }
    )

    return {
        fetchFeedbacks,
        submitFeedback,
        saveLocalFeedbacks,
        renderFeedbackMarkers,
        clearMarkers,
        clickedPosition,
        cancelAdding
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
