import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/composables/useWindow'
import { RouteDraftBuilder, createSectionSchema } from '#shared/schemas/route.schema'
import {
    createRouteElevationProfile,
    buildDraftSectionInputs,
    buildSavedSectionInputs
} from '~/composables/action/useRouteElevationProfile'
import { useTerrainSampler } from '~/composables/sideeffect/useTerrainSampler'
import { createRouteGpx, toGpxFileName } from '~/composables/action/useRouteGpx'
import { useRouteDrawStore } from '~/composables/store/useRouteDrawStore'
import {
    createDefaultSectionAttr,
    createHeightAwareRouteGeom,
    createInitialSectionDraft,
    createInitialSectionPointRanges,
    createSectionDraftsFromRanges
} from '~/composables/action/useRouteDrawDraft'
import useRouteDrawSideeffect from '~/composables/sideeffect/useRouteDrawSideeffect'
import { useRouteClosingSideeffect } from '~/composables/sideeffect/useRouteClosingSideeffect'
import { useRouteDownloadSideeffect } from '~/composables/sideeffect/useRouteDownloadSideeffect'
import { useRouteSaveSideeffect } from '~/composables/sideeffect/useRouteSaveSideeffect'
import { useRouteListSideeffect } from '~/composables/sideeffect/useRouteListSideeffect'
import { useRouteOptimizationSideeffect } from '~/composables/sideeffect/useRouteOptimizationSideeffect'
import { useAuthStore } from '~/composables/store/useAuthStore'
import { useNotificationStore } from '~/composables/store/useNotificationStore'

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
            const result = await optimizationEffect.optimizeRoute(positions, store.optimizationMode.value)
            if (result.optimized) {
                positions = result.positions
                store.drawnPositions.value = positions
                store.sectionPointRanges.value = createInitialSectionPointRanges(positions.length)
                store.sectionDraft.value = createInitialSectionDraft(
                    positions,
                    createHeightAwareRouteGeom(store.drawMetrics.value ?? undefined, positions)
                )
                drawEffect.redrawSectionGraphics()
                notification.notify({
                    title: '경로 보정 완료',
                    message: '보행자 경로로 자동 보정되었습니다.',
                    tone: 'success'
                })
            } else if (result.message) {
                notification.notify({
                    title: '경로 보정 건너뜀',
                    message: result.message,
                    tone: 'info'
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

    const buildSavePayload = () => {
        if (!store.sectionDraft.value) {
            throw new Error('먼저 구간을 그려주세요.')
        }

        if (!store.drawnPositions.value?.length) {
            throw new Error('경로 포인트가 없습니다.')
        }

        const originalPositions = store.drawnPositions.value
        const closingMode = store.closingMode.value
        const sectionPayload = createSectionSchema.parse(store.sectionDraft.value)

        let positions = originalPositions
        let ranges = store.sectionPointRanges.value
        let attrs = sectionPayload.attrs ?? []

        // 도착지 연결: 마지막점 → 첫점을 1개 구간으로 추가
        if (closingMode === 'loop-close' && originalPositions.length >= 2) {
            positions = [...originalPositions, originalPositions[0]!]
            ranges = [
                ...ranges,
                { start: originalPositions.length - 1, end: originalPositions.length }
            ]
            attrs = [...attrs, createDefaultSectionAttr(attrs.length)]
        }

        // 왕복 코스: 역순 경로를 원래 구간 수만큼 미러링하여 추가
        if (closingMode === 'round-trip' && originalPositions.length >= 2) {
            const returnPositions = [...originalPositions].reverse()
            positions = [...originalPositions, ...returnPositions]

            const originalLength = originalPositions.length
            const reversedRanges = [...ranges].reverse()
            let cursor = originalLength
            const returnRanges = reversedRanges.map((r) => {
                const size = r.end - r.start + 1
                const range = { start: cursor, end: cursor + size - 1 }
                cursor = range.end
                return range
            })
            ranges = [...ranges, ...returnRanges]
            attrs = [
                ...attrs,
                ...returnRanges.map((_, i) => createDefaultSectionAttr(attrs.length + i))
            ]
        }

        const routeGeom = createHeightAwareRouteGeom(
            store.drawMetrics.value ?? undefined,
            positions
        )
        const routeDraftPayload = new RouteDraftBuilder({
            ...(store.drawMetrics.value ?? {}),
            geoJson: routeGeom
        }).toRoute(store.routeForm.value)
        const sectionPayloads = createSectionDraftsFromRanges(
            attrs,
            ranges,
            positions,
            undefined,
            routeGeom
        ).map((section, index) => ({
            ...section,
            pois: store.sectionPois.value[index] ?? []
        }))

        return {
            routeDraftPayload,
            sectionPayloads
        }
    }

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
                tone: 'info'
            })
            return
        }

        try {
            const { routeDraftPayload, sectionPayloads } = buildSavePayload()

            await saveEffect.saveRoute(routeDraftPayload, sectionPayloads)
            await listEffect.fetchRoutes()

            store.isRouteSaveModalOpen.value = false
            store.resetRouteDrawState()
            store.activeNav.value = '목록'
            notification.notify({
                title: '저장 완료',
                message: '경로가 저장되었습니다.',
                tone: 'success'
            })
        } catch (error) {
            notification.notify({
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
            notification.notify({
                title: '다운로드 준비 완료',
                message: `${route.title} GPX 다운로드를 시작했습니다.`,
                tone: 'success'
            })
        } catch (error) {
            notification.notify({
                title: '다운로드 실패',
                message:
                    error instanceof Error ? error.message : 'GPX 다운로드 중 오류가 발생했습니다.',
                tone: 'error'
            })
        }
    }

    const addPoiToSection = (sectionIndex: number, poi: import('#shared/types/facility').PoiDraftInput) => {
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

    const drawing = proxyRefs({
        sectionDraft: store.sectionDraft,
        sectionPois: store.sectionPois,
        activeSectionIndex: store.activeSectionIndex,
        start: restartDrawing,
        openSaveModal: () => drawEffect.handleDrawSave(),
        updateSectionAttr: drawEffect.handleUpdateSectionAttr,
        removeSection: drawEffect.handleRemoveSection,
        addPoiToSection,
        removePoiFromSection
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

    const closing = proxyRefs({
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
        isOptimizing: store.isOptimizing
    }
}
