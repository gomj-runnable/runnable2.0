import type { Ref, ShallowRef } from 'vue'
import type { DrawActionData, CesiumViewer } from '~/shared/lib/useWindow'
import type { CreateSectionSchema } from '#shared/schemas/route.schema'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'
import { createSectionSchema } from '#shared/schemas/route.schema'
import {
    createHeightAwareRouteGeom,
    createInitialSectionDraft,
    createInitialSectionPointRanges,
    mergeSectionPointRanges,
    removeSectionDraftAttr,
    syncSectionAttrs,
    updateSectionDraftAttr
} from '~/entities/route/lib/useRouteDrawDraft'
import { normalizeDrawPositions } from '~/entities/route/lib/useRouteDrawUtils'
import { useSplitModeSideeffect } from './useSplitModeSideeffect'
import type { NotificationOptions } from '~/entities/notification/model/useNotificationStore'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'
import { useRouteGraphicsRenderer } from '~/features/draw-route/lib/useRouteGraphicsRenderer'

interface UseRouteDrawSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    drawnPositions: Ref<GeoJsonPosition[] | null>
    drawMetrics: Ref<DrawActionData | null>
    sectionDraft: Ref<CreateSectionSchema | null>
    sectionPointRanges: Ref<Array<{ start: number; end: number }>>
    isRouteSaveModalOpen: Ref<boolean>
    resetRouteDrawState: () => void
    closingMode?: Ref<RouteClosingModeEnum | null>
    notify: (options: NotificationOptions) => void
}

/** 경로 드로잉 이벤트(리셋·저장·구간 수정·삭제)를 오케스트레이션하는 sideeffect composable. */
const useRouteDrawSideeffect = (options: UseRouteDrawSideeffectOptions) => {
    const isDrawingActive = ref(false)

    const { sectionPolylines, sectionPoints, clearSectionGraphics, redrawSectionGraphics } =
        useRouteGraphicsRenderer({
            viewer: options.viewer,
            drawnPositions: options.drawnPositions,
            sectionPointRanges: options.sectionPointRanges,
            closingMode: options.closingMode
        })

    // ─── Split Mode (구간 포인트 선택/드래그) ───────────────────────
    const { splitMode, enterSplitMode, exitSplitMode } = useSplitModeSideeffect({
        viewer: options.viewer,
        drawnPositions: options.drawnPositions,
        sectionPointRanges: options.sectionPointRanges,
        sectionDraft: options.sectionDraft,
        notify: options.notify,
        onAfterSplit: () => redrawSectionGraphics()
    })

    /** 드로잉을 초기화하고 새 경로 드로잉을 시작한다. */
    const handleDrawReset = async (): Promise<GeoJsonPosition[] | null> => {
        if (!options.viewer.value) {
            options.notify({
                title: '지도 로딩 중',
                message: '지도를 아직 불러오는 중입니다.',
                tone: NotificationToneEnum.WARNING
            })
            return null
        }

        clearSectionGraphics()
        options.resetRouteDrawState()

        isDrawingActive.value = true

        options.notify({ title: '경로 그리기', message: '좌클릭: 구간 추가\n우클릭: 완료' })

        const result = await options.viewer.value._drawAction({
            shapeType: 1,
            showLabel: true
        })

        isDrawingActive.value = false

        if (!result || !('data' in result) || !result.data) {
            if (result && 'message' in result && result.message) {
                options.notify({
                    title: '알림',
                    message: result.message,
                    tone: NotificationToneEnum.WARNING
                })
            }
            return null
        }
        const data = result.data
        const positions = normalizeDrawPositions(getCesiumRuntime(), data)
        const routeGeom = createHeightAwareRouteGeom(data, positions)

        if (positions.length === 0) {
            return null
        }

        options.drawMetrics.value = data
            ? {
                  ...data,
                  GeoJSON: routeGeom ?? data.GeoJSON
              }
            : null
        options.drawnPositions.value = positions
        options.sectionPointRanges.value = createInitialSectionPointRanges(positions.length)
        options.sectionDraft.value = createInitialSectionDraft(positions, routeGeom)
        redrawSectionGraphics()
        return positions
    }

    /** 진행 중인 드로잉을 취소하고 지도 위 구간 그래픽을 정리한다. */
    const cancelDrawing = () => {
        if (!options.viewer.value) {
            return
        }

        isDrawingActive.value = false
        options.viewer.value._cancelDrawAction()
        clearSectionGraphics()
    }

    /** 진행 중인 드로잉을 현재 포인트로 완료한다. (모바일 우클릭 대체) */
    const finishDrawing = () => {
        if (!options.viewer.value) {
            return
        }

        options.viewer.value._finishDrawAction()
    }

    /** 현재 구간 초안을 Zod 스키마로 파싱하고 저장 모달을 연다. */
    const handleDrawSave = () => {
        if (!options.drawnPositions.value?.length || !options.sectionDraft.value) {
            options.notify({
                title: '구간 없음',
                message: '먼저 구간을 그려주세요.',
                tone: NotificationToneEnum.WARNING
            })
            return
        }

        options.sectionDraft.value = createSectionSchema.parse(options.sectionDraft.value)
        options.isRouteSaveModalOpen.value = true
    }

    /**
     * 구간 초안의 특정 구간 속성을 업데이트한다.
     */
    const handleUpdateSectionAttr = (payload: {
        index: number
        field: 'name' | 'comment' | 'description'
        value: string
    }) => {
        if (!options.sectionDraft.value) {
            return
        }

        options.sectionDraft.value = updateSectionDraftAttr(options.sectionDraft.value, payload)
    }

    /**
     * 특정 구간을 삭제하고 직전 구간과 병합한다.
     */
    const handleRemoveSection = ({ index }: { index: number }) => {
        if (!options.sectionDraft.value) {
            return
        }

        options.sectionPointRanges.value = mergeSectionPointRanges(
            options.sectionPointRanges.value,
            index
        )
        const nextDraft = removeSectionDraftAttr(options.sectionDraft.value, index)
        options.sectionDraft.value = {
            ...nextDraft,
            attrs: syncSectionAttrs(nextDraft.attrs ?? [], options.sectionPointRanges.value)
        }
        redrawSectionGraphics()
    }

    /**
     * 특정 구간의 포인트를 시각화하여 사용자가 분할 지점을 직접 선택하도록 한다.
     */
    const handleAddSection = ({ index }: { index: number }) => {
        if (!options.sectionDraft.value) return

        const range = options.sectionPointRanges.value[index]
        if (!range || range.end - range.start < 2) {
            options.notify({
                title: '구간 나누기 불가',
                message: '포인트가 충분하지 않아 구간을 나눌 수 없습니다.',
                tone: NotificationToneEnum.WARNING
            })
            return
        }

        enterSplitMode(index)
    }

    if (options.closingMode) {
        watch(options.closingMode, () => {
            redrawSectionGraphics()
        })
    }

    onBeforeUnmount(() => {
        exitSplitMode()
        sectionPolylines.clear()
        sectionPoints.clear()
    })

    return {
        cancelDrawing,
        finishDrawing,
        isDrawingActive: readonly(isDrawingActive),
        splitMode: readonly(splitMode),
        handleDrawReset,
        handleDrawSave,
        handleUpdateSectionAttr,
        handleRemoveSection,
        handleAddSection,
        exitSplitMode,
        redrawSectionGraphics,
        hideSectionPolylines: () => sectionPolylines.hide(),
        showSectionPolylines: () => sectionPolylines.show()
    }
}
export default useRouteDrawSideeffect
