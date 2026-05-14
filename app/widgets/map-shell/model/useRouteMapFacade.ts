import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { buildRouteSavePayload } from '~/entities/route/lib/useRouteSaveBuilder'
import {
    createRouteElevationProfile,
    buildDraftSectionInputs,
    buildSavedSectionInputs
} from '~/entities/route/lib/useRouteElevationProfile'
import { createRouteGpx, toGpxFileName } from '~/entities/route/lib/useRouteGpx'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import {
    createHeightAwareRouteGeom,
    createInitialSectionDraft,
    createInitialSectionPointRanges,
    createWaypointBasedSectionRanges
} from '~/entities/route/lib/useRouteDrawDraft'
import { parseGpxToPositions } from '~/entities/route/lib/useGpxParser'
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'
import { useRouteDrawingFacade } from './useRouteDrawingFacade'
import { useRouteClosingFacade } from './useRouteClosingFacade'
import { useRouteSaveFacade } from './useRouteSaveFacade'
import { useRouteListFacade } from './useRouteListFacade'
import { useRouteDownloadFacade } from './useRouteDownloadFacade'
import { useRouteOptimizationFacade } from './useRouteOptimizationFacade'
import { useRouteElevationFacade } from './useRouteElevationFacade'
import { useRouteTerrainSamplerFacade } from './useRouteTerrainSamplerFacade'

/**
 * 경로 지도 화면의 모든 기능을 단일 진입점으로 제공하는 Facade.
 *
 * 내부적으로 단일 책임 sub-facade 8종을 조합한다 (#127 Phase 2 시범 이관).
 * 페이지는 이 composable만 사용해 그리기·저장·목록 기능을 이용한다.
 * 외부 API는 sub-facade 도입 전과 동일하므로 호출처(`app/pages/index.vue`) 변경 없이 동작한다.
 *
 * @param viewer - 페이지에서 초기화한 Cesium 뷰어 ref
 */
interface RouteMapFacadeOptions {
    onAfterSave?: (routeId: string) => Promise<void>
}

export const useRouteMapFacade = (
    viewer: ShallowRef<CesiumViewer | null>,
    facadeOptions?: RouteMapFacadeOptions
) => {
    // ─── sub-facade 조합 ──────────────────────────────────────────

    const store = useRouteDrawStore()
    const notification = useNotificationStore()

    const drawingFacade = useRouteDrawingFacade(viewer)
    const closingFacade = useRouteClosingFacade(viewer)
    const saveFacade = useRouteSaveFacade()
    const downloadFacade = useRouteDownloadFacade()
    const terrainFacade = useRouteTerrainSamplerFacade(viewer)
    const listFacade = useRouteListFacade(viewer)
    const optimizationFacade = useRouteOptimizationFacade()
    const elevationFacade = useRouteElevationFacade()

    const showRouteInfoGuide = ref(false)

    /** 경로 폴리라인을 숨긴다 (경사도 등 오버레이 표시 시 사용) */
    const hideRoutePolylines = () => {
        drawingFacade.hideSectionPolylines()
        listFacade.hidePreviewPolylines()
    }

    /** 숨긴 경로 폴리라인을 복원한다 */
    const showRoutePolylines = () => {
        drawingFacade.showSectionPolylines()
        listFacade.showPreviewPolylines()
    }

    const startDrawing = async () => {
        elevationFacade.close()
        let positions = await drawingFacade.handleDrawReset()

        if (!positions?.length) {
            return
        }

        if (store.optimizationMode.value !== 'NONE') {
            const originalWaypoints = [...positions]
            const result = await optimizationFacade.optimizeRoute(
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
                drawingFacade.redrawSectionGraphics()
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
        const densified = await terrainFacade.densifyAndSampleSections(sectionInputs)

        elevationFacade.open('경로 고도 그래프', createRouteElevationProfile(densified))
        showRouteInfoGuide.value = true
    }

    const selectRoute = async (routeId: string) => {
        const sections = await listFacade.selectRoute(routeId)

        if (!sections?.length) {
            elevationFacade.close()
            return
        }

        const selectedRoute = store.routes.value.find((route) => route.routeId === routeId)

        const sectionInputs = buildSavedSectionInputs(sections)
        const densified = await terrainFacade.densifyAndSampleSections(sectionInputs)

        elevationFacade.open(
            selectedRoute?.title ?? '경로 고도 그래프',
            createRouteElevationProfile(densified)
        )

        return sections
    }

    /** 탐색 탭에서 공개 경로를 선택해 지도에 미리보기 + 고도 그래프를 표시한다 */
    const exploreSelectRoute = async (routeId: string, routeTitle?: string) => {
        // selectRoute는 내부에서 fetchRouteSections를 호출하므로 별도 호출 불필요
        listFacade.clearPreview()
        const sections = await listFacade.selectRoute(routeId)
        if (!sections?.length) {
            elevationFacade.close()
            return
        }

        const sectionInputs = buildSavedSectionInputs(sections)
        const densified = await terrainFacade.densifyAndSampleSections(sectionInputs)

        elevationFacade.open(
            routeTitle ?? '경로 고도 그래프',
            createRouteElevationProfile(densified)
        )
    }

    // ─── 내부 오케스트레이션 ──────────────────────────────────────

    /** 그리기 탭 진입 시 미리보기를 정리하고 드로잉을 시작한다 */
    watch(store.activeNav, async (next, prev) => {
        if (next === '그리기' && prev !== '그리기') {
            listFacade.clearPreview()
            listFacade.clearSelection()
            await nextTick()
            await startDrawing()
            return
        }

        if (prev === '그리기' && next !== '그리기') {
            drawingFacade.cancelDrawing()
        }

        if (next !== '그리기' && next !== '목록') {
            elevationFacade.close()
        }
    })

    /** 페이지 마운트 시 저장된 경로 목록을 자동으로 불러온다 */
    onMounted(async () => {
        await listFacade.fetchRoutes()
    })

    /** 진행 중인 드로잉이 있으면 취소한 뒤 새 드로잉을 시작한다. */
    const restartDrawing = async () => {
        drawingFacade.cancelDrawing()
        await nextTick()
        await startDrawing()
    }

    const buildSavePayload = () =>
        buildRouteSavePayload({
            sectionDraft: store.sectionDraft.value,
            drawnPositions: store.drawnPositions.value,
            closingMode: store.closingMode.value,
            sectionPointRanges: store.sectionPointRanges.value,
            drawMetrics: store.drawMetrics.value,
            routeForm: store.routeForm.value,
            sectionPois: store.sectionPois.value
        })

    /**
     * 저장 모달에서 "저장" 버튼 클릭 시 경로를 확정 저장한다.
     * 저장 성공 후 목록을 갱신하고 드로잉 상태를 초기화한다.
     */
    const authStore = useAuthStore()

    const confirmSave = async () => {
        if (!authStore.isLoggedIn.value) {
            store.isRouteSaveModalOpen.value = false
            authStore.openLoginModal()
            notification.notify({
                title: '로그인 필요',
                message: '경로를 저장하려면 먼저 로그인해주세요.',
                tone: NotificationToneEnum.INFO
            })
            return
        }

        try {
            const { routeDraftPayload, sectionPayloads } = buildSavePayload()
            const editId = store.editingRouteId.value

            if (editId) {
                await saveFacade.updateRoute(editId, routeDraftPayload, sectionPayloads)
            } else {
                const saveResult = (await saveFacade.saveRoute(
                    routeDraftPayload,
                    sectionPayloads
                )) as {
                    route: { routeId: string }
                }
                await facadeOptions?.onAfterSave?.(saveResult.route.routeId)
            }

            await listFacade.fetchRoutes()

            store.isRouteSaveModalOpen.value = false
            store.resetRouteDrawState()
            showRouteInfoGuide.value = false
            store.activeNav.value = '목록'
            notification.notify({
                title: editId ? '수정 완료' : '저장 완료',
                message: editId ? '경로가 수정되었습니다.' : '경로가 저장되었습니다.',
                tone: NotificationToneEnum.SUCCESS
            })
        } catch (error) {
            notification.notify({
                title: '저장 실패',
                message: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
                tone: NotificationToneEnum.ERROR
            })
        }
    }

    /**
     * GPX 파일에서 추출한 포인트 배열을 드로잉 상태에 주입한다.
     * 지형 고도 샘플링 후 기존 저장·구간 편집 플로우와 연결된다.
     *
     * @param file - 사용자가 선택한 .gpx 파일
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

            elevationFacade.close()
            drawingFacade.cancelDrawing()
            store.resetRouteDrawState()

            store.drawnPositions.value = positions
            store.sectionPointRanges.value = createInitialSectionPointRanges(positions.length)
            store.sectionDraft.value = createInitialSectionDraft(positions)

            const sectionInputs = buildDraftSectionInputs(
                positions,
                store.sectionPointRanges.value,
                store.sectionDraft.value?.attrs
            )
            const densified = await terrainFacade.densifyAndSampleSections(sectionInputs)
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

            drawingFacade.redrawSectionGraphics()

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

    const downloadRouteGpx = async (routeId: string) => {
        try {
            const route = store.routes.value.find((item) => item.routeId === routeId)

            if (!route) {
                throw new Error('경로 정보를 찾을 수 없습니다.')
            }

            const sections = await listFacade.fetchRouteSections(routeId)

            if (!sections.length) {
                throw new Error('다운로드할 경로 구간이 없습니다.')
            }

            downloadFacade.downloadTextFile(
                toGpxFileName(route.title),
                createRouteGpx(route, sections),
                'application/gpx+xml;charset=utf-8'
            )
            notification.notify({
                title: '다운로드 준비 완료',
                message: `${route.title} GPX 다운로드를 시작했습니다.`,
                tone: NotificationToneEnum.SUCCESS
            })
        } catch (error) {
            notification.notify({
                title: '다운로드 실패',
                message:
                    error instanceof Error ? error.message : 'GPX 다운로드 중 오류가 발생했습니다.',
                tone: NotificationToneEnum.ERROR
            })
        }
    }

    const drawing = reactive({
        sectionDraft: store.sectionDraft,
        sectionPois: store.sectionPois,
        activeSectionIndex: store.activeSectionIndex,
        isDrawingActive: drawingFacade.isDrawingActive,
        start: restartDrawing,
        finish: drawingFacade.finishDrawing,
        openSaveModal: drawingFacade.openSaveModal,
        updateSectionAttr: drawingFacade.updateSectionAttr,
        removeSection: drawingFacade.removeSection,
        addSection: drawingFacade.addSection,
        addPoiToSection: drawingFacade.addPoiToSection,
        removePoiFromSection: drawingFacade.removePoiFromSection,
        importFromGpxFile
    })

    const saveModal = reactive({
        open: store.isRouteSaveModalOpen,
        routeForm: store.routeForm,
        routeDistance: store.routeDistance,
        editingRouteId: store.editingRouteId,
        confirm: confirmSave
    })

    const routeList = reactive({
        searchQuery: listFacade.searchQuery,
        filteredRoutes: listFacade.filteredRoutes,
        selectedRouteId: listFacade.selectedRouteId,
        select: selectRoute,
        download: downloadRouteGpx,
        refresh: () => listFacade.fetchRoutes()
    })

    const elevationChart = reactive({
        open: elevationFacade.isOpen,
        title: elevationFacade.title,
        profile: elevationFacade.profile,
        setOpen: elevationFacade.setOpen,
        close: elevationFacade.close
    })

    const closing = reactive({
        mode: closingFacade.mode,
        setMode: closingFacade.setMode,
        isLoopClose: closingFacade.isLoopClose,
        isRoundTrip: closingFacade.isRoundTrip
    })

    // ─── 공개 인터페이스 ──────────────────────────────────────────

    return {
        activeNav: store.activeNav,
        drawing,
        saveModal,
        routeList,
        elevationChart,
        closing,
        exploreSelectRoute,
        optimizationMode: store.optimizationMode,
        isOptimizing: store.isOptimizing,
        hideRoutePolylines,
        showRoutePolylines,
        showRouteInfoGuide
    }
}
