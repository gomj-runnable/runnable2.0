import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { buildRouteSavePayload } from '~/entities/route/lib/useRouteSaveBuilder'
import {
    createRouteElevationProfile,
    buildDraftSectionInputs,
    buildSavedSectionInputs
} from '~/entities/route/lib/useRouteElevationProfile'
import { useTerrainSampler } from '~/shared/lib/map/useTerrainSampler'
import { createRouteGpx, toGpxFileName } from '~/entities/route/lib/useRouteGpx'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import {
    createHeightAwareRouteGeom,
    createInitialSectionDraft,
    createInitialSectionPointRanges,
    createWaypointBasedSectionRanges
} from '~/entities/route/lib/useRouteDrawDraft'
import { parseGpxToPositions } from '~/entities/route/lib/useGpxParser'
import useRouteDrawSideeffect from '~/features/draw-route/api/useRouteDrawSideeffect'
import { useRouteClosingSideeffect } from '~/features/draw-route/api/useRouteClosingSideeffect'
import { useRouteDownloadSideeffect } from '~/features/draw-route/api/useRouteDownloadSideeffect'
import { useRouteSaveSideeffect } from '~/features/draw-route/api/useRouteSaveSideeffect'
import { useRouteListSideeffect } from '~/features/draw-route/api/useRouteListSideeffect'
import { useRouteOptimizationSideeffect } from '~/features/draw-route/api/useRouteOptimizationSideeffect'
import { useAuthStore } from '~/entities/user/model/useAuthStore'
import { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'

/**
 * 경로 지도 화면의 모든 기능을 단일 진입점으로 제공하는 Facade.
 *
 * 내부적으로 store, draw/save/list sideeffect를 조합하며,
 * 페이지는 이 composable만 사용해 그리기·저장·목록 기능을 이용한다.
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
    // ─── 내부 의존성 조합 ─────────────────────────────────────────

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

    const saveEffect = useRouteSaveSideeffect()
    const downloadEffect = useRouteDownloadSideeffect()

    const showRouteInfoGuide = ref(false)

    const terrainSampler = useTerrainSampler(viewer)

    const listEffect = useRouteListSideeffect({
        viewer,
        routes: store.routes,
        selectedRouteId: store.selectedRouteId,
        drawnPositions: store.drawnPositions
    })

    const optimizationEffect = useRouteOptimizationSideeffect({
        isOptimizing: store.isOptimizing
    })

    /** 경로 폴리라인을 숨긴다 (경사도 등 오버레이 표시 시 사용) */
    const hideRoutePolylines = () => {
        drawEffect.hideSectionPolylines()
        listEffect.hidePreviewPolylines()
    }

    /** 숨긴 경로 폴리라인을 복원한다 */
    const showRoutePolylines = () => {
        drawEffect.showSectionPolylines()
        listEffect.showPreviewPolylines()
    }

    const closeElevationChart = () => {
        store.isElevationChartOpen.value = false
        store.elevationProfile.value = null
    }

    const setElevationChartOpen = (open: boolean) => {
        store.isElevationChartOpen.value = open
    }

    const openElevationChart = (
        title: string,
        profile: ReturnType<typeof createRouteElevationProfile>
    ) => {
        if (!profile) {
            closeElevationChart()
            return
        }

        store.elevationChartTitle.value = title
        store.elevationProfile.value = profile
        store.isElevationChartOpen.value = true
    }

    const startDrawing = async () => {
        closeElevationChart()
        let positions = await drawEffect.handleDrawReset()

        if (!positions?.length) {
            return
        }

        if (store.optimizationMode.value !== 'NONE') {
            const originalWaypoints = [...positions]
            const result = await optimizationEffect.optimizeRoute(
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
        const densified = await terrainSampler.densifyAndSampleSections(sectionInputs)

        openElevationChart('경로 고도 그래프', createRouteElevationProfile(densified))
        showRouteInfoGuide.value = true
    }

    const selectRoute = async (routeId: string) => {
        const sections = await listEffect.selectRoute(routeId)

        if (!sections?.length) {
            closeElevationChart()
            return
        }

        const selectedRoute = store.routes.value.find((route) => route.routeId === routeId)

        const sectionInputs = buildSavedSectionInputs(sections)
        const densified = await terrainSampler.densifyAndSampleSections(sectionInputs)

        openElevationChart(
            selectedRoute?.title ?? '경로 고도 그래프',
            createRouteElevationProfile(densified)
        )

        return sections
    }

    /** 탐색 탭에서 공개 경로를 선택해 지도에 미리보기 + 고도 그래프를 표시한다 */
    const exploreSelectRoute = async (routeId: string, routeTitle?: string) => {
        // selectRoute는 내부에서 fetchRouteSections를 호출하므로 별도 호출 불필요
        listEffect.clearPreview()
        const sections = await listEffect.selectRoute(routeId)
        if (!sections?.length) {
            closeElevationChart()
            return
        }

        const sectionInputs = buildSavedSectionInputs(sections)
        const densified = await terrainSampler.densifyAndSampleSections(sectionInputs)

        openElevationChart(routeTitle ?? '경로 고도 그래프', createRouteElevationProfile(densified))
    }

    // ─── 내부 오케스트레이션 ──────────────────────────────────────

    /** 그리기 탭 진입 시 미리보기를 정리하고 드로잉을 시작한다 */
    watch(store.activeNav, async (next, prev) => {
        if (next === '그리기' && prev !== '그리기') {
            listEffect.clearPreview()
            listEffect.clearSelection()
            await nextTick()
            await startDrawing()
            return
        }

        if (prev === '그리기' && next !== '그리기') {
            drawEffect.cancelDrawing()
        }

        if (next !== '그리기' && next !== '목록') {
            closeElevationChart()
        }
    })

    /** 페이지 마운트 시 저장된 경로 목록을 자동으로 불러온다 */
    onMounted(async () => {
        await listEffect.fetchRoutes()
    })

    // ─── 파생 상태 ────────────────────────────────────────────────

    /** 검색어로 필터링된 경로 목록 */
    const filteredRoutes = computed(() =>
        store.routes.value.filter((r) => r.title.includes(store.searchQuery.value))
    )

    /** 진행 중인 드로잉이 있으면 취소한 뒤 새 드로잉을 시작한다. */
    const restartDrawing = async () => {
        drawEffect.cancelDrawing()
        await nextTick()
        await startDrawing()
    }

    /**
     * GPX 파일에서 추출한 포인트 배열을 드로잉 상태에 주입한다.
     * 지형 고도 샘플링 후 기존 저장·구간 편집 플로우와 연결된다.
     *
     * @param file - 사용자가 선택한 .gpx 파일
     */
    const importFromGpxFile = async (file: File) => {
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

        closeElevationChart()
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
        const densified = await terrainSampler.densifyAndSampleSections(sectionInputs)
        const terrainPositions = densified.flatMap((s) => s.positions)

        if (terrainPositions.length === positions.length) {
            store.drawnPositions.value = terrainPositions
            store.sectionDraft.value = createInitialSectionDraft(terrainPositions)
        }

        drawEffect.redrawSectionGraphics()

        notification.notify({
            title: 'GPX 불러오기 완료',
            message: `${positions.length}개 포인트를 불러왔습니다.`,
            tone: NotificationToneEnum.SUCCESS
        })
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
                await saveEffect.updateRoute(editId, routeDraftPayload, sectionPayloads)
            } else {
                const saveResult = (await saveEffect.saveRoute(
                    routeDraftPayload,
                    sectionPayloads
                )) as {
                    route: { routeId: string }
                }
                await facadeOptions?.onAfterSave?.(saveResult.route.routeId)
            }

            await listEffect.fetchRoutes()

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

    const downloadRouteGpx = async (routeId: string) => {
        try {
            const route = store.routes.value.find((item) => item.routeId === routeId)

            if (!route) {
                throw new Error('경로 정보를 찾을 수 없습니다.')
            }

            const sections = await listEffect.fetchRouteSections(routeId)

            if (!sections.length) {
                throw new Error('다운로드할 경로 구간이 없습니다.')
            }

            downloadEffect.downloadTextFile(
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

    const saveModal = reactive({
        open: store.isRouteSaveModalOpen,
        routeForm: store.routeForm,
        routeDistance: store.routeDistance,
        editingRouteId: store.editingRouteId,
        confirm: confirmSave
    })

    const routeList = reactive({
        searchQuery: store.searchQuery,
        filteredRoutes,
        selectedRouteId: store.selectedRouteId,
        select: selectRoute,
        download: downloadRouteGpx,
        refresh: () => listEffect.fetchRoutes()
    })

    const elevationChart = reactive({
        open: store.isElevationChartOpen,
        title: store.elevationChartTitle,
        profile: store.elevationProfile,
        setOpen: setElevationChartOpen,
        close: closeElevationChart
    })

    const closing = reactive({
        mode: store.closingMode,
        setMode: store.setClosingMode,
        isLoopClose: store.isLoopClose,
        isRoundTrip: store.isRoundTrip
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
