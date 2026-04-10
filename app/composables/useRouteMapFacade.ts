import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/composables/useWindow'
import { RouteDraftBuilder, createSectionSchema } from '#shared/schemas/route.schema'
import {
    createRouteElevationProfile,
    densifyPositions,
    buildDraftSectionInputs,
    buildSavedSectionInputs
} from '~/composables/action/useRouteElevationProfile'
import { useTerrainSampler } from '~/composables/sideeffect/useTerrainSampler'
import { createRouteGpx, toGpxFileName } from '~/composables/action/useRouteGpx'
import { useRouteDrawStore } from '~/composables/store/useRouteDrawStore'
import {
    createHeightAwareRouteGeom,
    createSectionDraftsFromRanges
} from '~/composables/action/useRouteDrawDraft'
import useRouteDrawSideeffect from '~/composables/sideeffect/useRouteDrawSideeffect'
import { useRouteDownloadSideeffect } from '~/composables/sideeffect/useRouteDownloadSideeffect'
import { useRouteSaveSideeffect } from '~/composables/sideeffect/useRouteSaveSideeffect'
import { useRouteListSideeffect } from '~/composables/sideeffect/useRouteListSideeffect'

/**
 * 경로 지도 화면의 모든 기능을 단일 진입점으로 제공하는 Facade.
 *
 * 내부적으로 store, draw/save/list sideeffect를 조합하며,
 * 페이지는 이 composable만 사용해 그리기·저장·목록 기능을 이용한다.
 *
 * @param viewer - 페이지에서 초기화한 Cesium 뷰어 ref
 */
export const useRouteMapFacade = (viewer: ShallowRef<CesiumViewer | null>) => {
    // ─── 내부 의존성 조합 ─────────────────────────────────────────

    const store = useRouteDrawStore()

    const drawEffect = useRouteDrawSideeffect({
        viewer,
        drawnPositions: store.drawnPositions,
        drawMetrics: store.drawMetrics,
        sectionDraft: store.sectionDraft,
        sectionPointRanges: store.sectionPointRanges,
        isRouteSaveModalOpen: store.isRouteSaveModalOpen,
        resetRouteDrawState: store.resetRouteDrawState
    })

    const saveEffect = useRouteSaveSideeffect()
    const downloadEffect = useRouteDownloadSideeffect()

    const terrainSampler = useTerrainSampler(viewer)

    const densifyAndSample = async (sections: ReturnType<typeof buildDraftSectionInputs>) =>
        Promise.all(
            sections.map(async (s) => ({
                ...s,
                positions: await terrainSampler.sampleTerrain(densifyPositions(s.positions))
            }))
        )

    const listEffect = useRouteListSideeffect({
        viewer,
        routes: store.routes,
        selectedRouteId: store.selectedRouteId
    })

    const feedbackModal = ref({
        open: false,
        title: '',
        message: '',
        tone: 'info' as 'success' | 'error' | 'info'
    })

    const openFeedbackModal = (payload: {
        title: string
        message: string
        tone?: 'success' | 'error' | 'info'
    }) => {
        feedbackModal.value = {
            open: true,
            title: payload.title,
            message: payload.message,
            tone: payload.tone ?? 'info'
        }
    }

    const closeFeedbackModal = () => {
        feedbackModal.value.open = false
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
        const positions = await drawEffect.handleDrawReset()

        if (!positions?.length) {
            return
        }

        const sectionInputs = buildDraftSectionInputs(
            positions,
            store.sectionPointRanges.value,
            store.sectionDraft.value?.attrs
        )
        const densified = await densifyAndSample(sectionInputs)

        openElevationChart(
            '경로 고도 그래프',
            createRouteElevationProfile(densified)
        )
    }

    const selectRoute = async (routeId: string) => {
        const sections = await listEffect.selectRoute(routeId)

        if (!sections?.length) {
            closeElevationChart()
            return
        }

        const selectedRoute = store.routes.value.find((route) => route.routeId === routeId)

        const sectionInputs = buildSavedSectionInputs(sections)
        const densified = await densifyAndSample(sectionInputs)

        openElevationChart(
            selectedRoute?.title ?? '경로 고도 그래프',
            createRouteElevationProfile(densified)
        )
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

    const buildSavePayload = () => {
        if (!store.sectionDraft.value) {
            throw new Error('먼저 구간을 그려주세요.')
        }

        if (!store.drawnPositions.value?.length) {
            throw new Error('경로 포인트가 없습니다.')
        }

        const routeGeom = createHeightAwareRouteGeom(
            store.drawMetrics.value ?? undefined,
            store.drawnPositions.value
        )
        const routeDraftPayload = new RouteDraftBuilder({
            ...(store.drawMetrics.value ?? {}),
            geoJson: routeGeom
        }).toRoute(store.routeForm.value)
        const sectionPayload = createSectionSchema.parse(store.sectionDraft.value)
        const sectionPayloads = createSectionDraftsFromRanges(
            sectionPayload.attrs ?? [],
            store.sectionPointRanges.value,
            store.drawnPositions.value,
            undefined,
            routeGeom
        )

        return {
            routeDraftPayload,
            sectionPayloads
        }
    }

    /**
     * 저장 모달에서 "저장" 버튼 클릭 시 경로를 확정 저장한다.
     * 저장 성공 후 목록을 갱신하고 드로잉 상태를 초기화한다.
     */
    const confirmSave = async () => {
        try {
            const { routeDraftPayload, sectionPayloads } = buildSavePayload()

            await saveEffect.saveRoute(routeDraftPayload, sectionPayloads)
            await listEffect.fetchRoutes()

            store.isRouteSaveModalOpen.value = false
            store.resetRouteDrawState()
            store.activeNav.value = '목록'
            openFeedbackModal({
                title: '저장 완료',
                message: '경로가 저장되었습니다.',
                tone: 'success'
            })
        } catch (error) {
            openFeedbackModal({
                title: '저장 실패',
                message: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
                tone: 'error'
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
            openFeedbackModal({
                title: '다운로드 준비 완료',
                message: `${route.title} GPX 다운로드를 시작했습니다.`,
                tone: 'success'
            })
        } catch (error) {
            openFeedbackModal({
                title: '다운로드 실패',
                message:
                    error instanceof Error ? error.message : 'GPX 다운로드 중 오류가 발생했습니다.',
                tone: 'error'
            })
        }
    }

    const drawing = proxyRefs({
        sectionDraft: store.sectionDraft,
        start: restartDrawing,
        openSaveModal: () => drawEffect.handleDrawSave(),
        updateSectionAttr: drawEffect.handleUpdateSectionAttr,
        removeSection: drawEffect.handleRemoveSection
    })

    const saveModal = proxyRefs({
        open: store.isRouteSaveModalOpen,
        routeForm: store.routeForm,
        routeDistance: store.routeDistance,
        confirm: confirmSave
    })

    const routeList = proxyRefs({
        searchQuery: store.searchQuery,
        filteredRoutes,
        selectedRouteId: store.selectedRouteId,
        select: selectRoute,
        download: downloadRouteGpx
    })

    const elevationChart = proxyRefs({
        open: store.isElevationChartOpen,
        title: store.elevationChartTitle,
        profile: store.elevationProfile,
        setOpen: setElevationChartOpen,
        close: closeElevationChart
    })

    const feedback = proxyRefs({
        open: computed(() => feedbackModal.value.open),
        title: computed(() => feedbackModal.value.title),
        message: computed(() => feedbackModal.value.message),
        tone: computed(() => feedbackModal.value.tone),
        close: closeFeedbackModal
    })

    // ─── 공개 인터페이스 ──────────────────────────────────────────

    return {
        activeNav: store.activeNav,
        drawing,
        saveModal,
        routeList,
        elevationChart,
        feedback
    }
}
