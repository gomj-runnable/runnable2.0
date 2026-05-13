import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import {
    buildDraftSectionInputs,
    createRouteElevationProfile
} from '~/entities/route/lib/useRouteElevationProfile'
import {
    createHeightAwareRouteGeom,
    createInitialSectionDraft,
    createInitialSectionPointRanges,
    createWaypointBasedSectionRanges
} from '~/entities/route/lib/useRouteDrawDraft'
import { parseGpxToPositions } from '~/entities/route/lib/useGpxParser'
import useRouteDrawSideeffect from '~/features/draw-route/api/useRouteDrawSideeffect'
import { useRouteClosingSideeffect } from '~/features/draw-route/api/useRouteClosingSideeffect'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'
import type { useRouteOptimizationFacade } from './useRouteOptimizationFacade'
import type { useRouteTerrainFacade } from './useRouteTerrainFacade'
import type { useRouteElevationFacade } from './useRouteElevationFacade'

/**
 * 경로 그리기·GPX 가져오기 기능을 제공하는 sub-facade.
 *
 * optimization/terrain/elevation은 오케스트레이터에서 생성된 인스턴스를 주입받는다.
 */
export const useRouteDrawingFacade = (
    viewer: ShallowRef<CesiumViewer | null>,
    deps: {
        optimizationFacade: ReturnType<typeof useRouteOptimizationFacade>
        terrainFacade: ReturnType<typeof useRouteTerrainFacade>
        elevationFacade: ReturnType<typeof useRouteElevationFacade>
    }
) => {
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

    useRouteClosingSideeffect({
        viewer,
        drawnPositions: store.drawnPositions,
        closingMode: store.closingMode
    })

    const { optimizationFacade, terrainFacade, elevationFacade } = deps

    const startDrawing = async () => {
        elevationFacade.closeElevationChart()
        let positions = await drawEffect.handleDrawReset()

        if (!positions?.length) {
            return
        }

        if (store.optimizationMode.value !== 'NONE') {
            const originalWaypoints = [...positions]
            const result = await optimizationFacade.optimizationEffect.optimizeRoute(
                positions,
                store.optimizationMode.value
            )
            if (result.optimized) {
                positions = result.positions
                store.drawnPositions.value = positions
                store.sectionPointRanges.value = createWaypointBasedSectionRanges(
                    positions,
                    originalWaypoints
                )
                store.sectionDraft.value = createInitialSectionDraft(
                    positions,
                    createHeightAwareRouteGeom(store.drawMetrics.value ?? undefined, positions)
                )
                drawEffect.redrawSectionGraphics()
                notification.notify({
                    title: '경로 보정 완료',
                    message: '보행자 경로로 자동 보정되었습니다.',
                    tone: NotificationToneEnum.SUCCESS
                })
            } else {
                notification.notify({
                    title: '경로 보정 건너뜀',
                    message: result.message ?? '경로 보정 서비스에 연결할 수 없습니다.',
                    tone: NotificationToneEnum.WARNING
                })
            }
        }

        const sectionInputs = buildDraftSectionInputs(
            positions,
            store.sectionPointRanges.value,
            store.sectionDraft.value?.attrs
        )
        const densified = await terrainFacade.terrainSampler.densifyAndSampleSections(sectionInputs)

        elevationFacade.openElevationChart(
            '경로 고도 그래프',
            createRouteElevationProfile(densified)
        )
    }

    /** 진행 중인 드로잉이 있으면 취소한 뒤 새 드로잉을 시작한다. */
    const restartDrawing = async () => {
        drawEffect.cancelDrawing()
        await nextTick()
        await startDrawing()
    }

    /**
     * GPX 파일에서 추출한 포인트 배열을 드로잉 상태에 주입한다.
     */
    const importFromGpxFile = async (file: File) => {
        try {
            if (file.size > 10 * 1024 * 1024) {
                notification.notify({
                    title: 'GPX 파일 너무 큼',
                    message: '파일 크기가 10MB를 초과합니다. 더 작은 파일을 사용해주세요.',
                    tone: NotificationToneEnum.WARNING
                })
                return
            }

            const xml = await file.text()
            const positions = parseGpxToPositions(xml)

            if (positions.length < 2) {
                notification.notify({
                    title: 'GPX 오류',
                    message: '유효한 경로 포인트가 2개 미만입니다.',
                    tone: NotificationToneEnum.WARNING
                })
                return
            }

            elevationFacade.closeElevationChart()
            drawEffect.cancelDrawing()
            store.resetRouteDrawState()

            store.drawnPositions.value = positions
            store.sectionPointRanges.value = createInitialSectionPointRanges(positions.length)
            store.sectionDraft.value = createInitialSectionDraft(positions)

            const sectionInputs = buildDraftSectionInputs(
                positions,
                store.sectionPointRanges.value,
                store.sectionDraft.value?.attrs
            )
            const densified =
                await terrainFacade.terrainSampler.densifyAndSampleSections(sectionInputs)
            const terrainPositions = densified.flatMap((s) => s.positions)

            if (terrainPositions.length === positions.length) {
                store.drawnPositions.value = terrainPositions
                store.sectionDraft.value = createInitialSectionDraft(terrainPositions)
            } else {
                notification.notify({
                    title: '지형 고도 보정 건너뜀',
                    message:
                        '지형 고도 샘플링 결과가 포인트 수와 맞지 않아 원본 고도를 사용합니다.',
                    tone: NotificationToneEnum.WARNING
                })
            }

            drawEffect.redrawSectionGraphics()

            notification.notify({
                title: 'GPX 불러오기 완료',
                message: `${positions.length}개 포인트를 불러왔습니다.`,
                tone: NotificationToneEnum.SUCCESS
            })
        } catch (error) {
            notification.notify({
                title: 'GPX 불러오기 실패',
                message:
                    error instanceof Error
                        ? error.message
                        : 'GPX 파일을 불러오는 중 오류가 발생했습니다.',
                tone: NotificationToneEnum.ERROR
            })
        }
    }

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

    const drawing = reactive({
        sectionDraft: store.sectionDraft,
        sectionPois: store.sectionPois,
        activeSectionIndex: store.activeSectionIndex,
        isDrawingActive: drawEffect.isDrawingActive,
        start: restartDrawing,
        finish: drawEffect.finishDrawing,
        openSaveModal: () => drawEffect.handleDrawSave(),
        updateSectionAttr: drawEffect.handleUpdateSectionAttr,
        removeSection: drawEffect.handleRemoveSection,
        addSection: drawEffect.handleAddSection,
        addPoiToSection,
        removePoiFromSection,
        importFromGpxFile
    })

    return {
        drawEffect,
        drawing,
        startDrawing,
        restartDrawing
    }
}
