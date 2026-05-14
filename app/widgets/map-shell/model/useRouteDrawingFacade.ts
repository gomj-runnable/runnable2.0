import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import useRouteDrawSideeffect from '~/features/draw-route/api/useRouteDrawSideeffect'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'

/**
 * 경로 드로잉 sideeffect를 store·notification과 묶어 단일 책임 단위로 노출하는 facade.
 *
 * #112 결정(단일 책임 8분할, 점진적 마이그레이션, `useXxxFacade` 명명)에 따라
 * `useRouteMapFacade`에서 drawing 영역만 추출. 호출처는 #127 Phase 2에서 순차 이관한다.
 *
 * `useRouteMapFacade`와 병행 사용 가능하지만 같은 store를 공유하므로 동일 페이지에서 중복 wiring하지 않는다.
 */
export const useRouteDrawingFacade = (viewer: ShallowRef<CesiumViewer | null>) => {
    const store = useRouteDrawStore()
    const notification = useNotificationStore()

    const drawEffect = useRouteDrawSideeffect({
        viewer,
        drawnPositions: store.drawnPositions,
        drawMetrics: store.drawMetrics,
        sectionDraft: store.sectionDraft,
        sectionPointRanges: store.sectionPointRanges,
        isRouteSaveModalOpen: store.isRouteSaveModalOpen,
        resetRouteDrawState: store.resetRouteDrawState,
        closingMode: store.closingMode,
        notify: notification.notify
    })

    const addPoiToSection = (
        sectionIndex: number,
        poi: import('#shared/types/facility').PoiDraftInput
    ) => {
        const current = store.sectionPois.value[sectionIndex] ?? []
        store.sectionPois.value = {
            ...store.sectionPois.value,
            [sectionIndex]: [...current, poi]
        }
    }

    const removePoiFromSection = (sectionIndex: number, poiIndex: number) => {
        const current = store.sectionPois.value[sectionIndex] ?? []
        store.sectionPois.value = {
            ...store.sectionPois.value,
            [sectionIndex]: current.filter((_, i) => i !== poiIndex)
        }
    }

    return {
        sectionDraft: store.sectionDraft,
        sectionPois: store.sectionPois,
        activeSectionIndex: store.activeSectionIndex,
        drawnPositions: store.drawnPositions,
        drawMetrics: store.drawMetrics,
        sectionPointRanges: store.sectionPointRanges,
        isDrawingActive: drawEffect.isDrawingActive,
        handleDrawReset: drawEffect.handleDrawReset,
        finishDrawing: drawEffect.finishDrawing,
        cancelDrawing: drawEffect.cancelDrawing,
        openSaveModal: () => drawEffect.handleDrawSave(),
        updateSectionAttr: drawEffect.handleUpdateSectionAttr,
        removeSection: drawEffect.handleRemoveSection,
        addSection: drawEffect.handleAddSection,
        redrawSectionGraphics: drawEffect.redrawSectionGraphics,
        hideSectionPolylines: drawEffect.hideSectionPolylines,
        showSectionPolylines: drawEffect.showSectionPolylines,
        addPoiToSection,
        removePoiFromSection
    }
}
