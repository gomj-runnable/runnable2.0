import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import {
    buildSavedSectionInputs,
    createRouteElevationProfile
} from '~/entities/route/lib/useRouteElevationProfile'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import { useRouteClosingFacade } from './useRouteClosingFacade'
import { useRouteOptimizationFacade } from './useRouteOptimizationFacade'
import { useRouteElevationFacade } from './useRouteElevationFacade'
import { useRouteTerrainFacade } from './useRouteTerrainFacade'
import { useRouteListFacade } from './useRouteListFacade'
import { useRouteDownloadFacade } from './useRouteDownloadFacade'
import { useRouteSaveFacade } from './useRouteSaveFacade'
import { useRouteDrawingFacade } from './useRouteDrawingFacade'

/**
 * 경로 지도 화면의 모든 기능을 단일 진입점으로 제공하는 Facade.
 *
 * 내부적으로 8개의 sub-facade를 조합하며,
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
    // ─── sub-facade 조합 ──────────────────────────────────────────

    const store = useRouteDrawStore()

    const optimizationFacade = useRouteOptimizationFacade()
    const terrainFacade = useRouteTerrainFacade(viewer)
    const elevationFacade = useRouteElevationFacade()
    const { closing } = useRouteClosingFacade()

    const { listEffect, filteredRoutes, searchQuery, selectedRouteId } = useRouteListFacade(viewer)
    const { downloadRouteGpx } = useRouteDownloadFacade(listEffect)
    const { saveModal, confirmSave } = useRouteSaveFacade(listEffect, {
        onAfterSave: facadeOptions?.onAfterSave
    })
    const { drawEffect, drawing, startDrawing } = useRouteDrawingFacade(viewer, {
        optimizationFacade,
        terrainFacade,
        elevationFacade
    })

    // ─── 교차 의존 오케스트레이션 ─────────────────────────────────

    const showRouteInfoGuide = ref(false)

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

    const selectRoute = async (routeId: string) => {
        const sections = await listEffect.selectRoute(routeId)

        if (!sections?.length) {
            elevationFacade.closeElevationChart()
            return
        }

        const selectedRoute = store.routes.value.find((route) => route.routeId === routeId)
        const sectionInputs = buildSavedSectionInputs(sections)
        const densified = await terrainFacade.terrainSampler.densifyAndSampleSections(sectionInputs)

        elevationFacade.openElevationChart(
            selectedRoute?.title ?? '경로 고도 그래프',
            createRouteElevationProfile(densified)
        )

        return sections
    }

    /** 탐색 탭에서 공개 경로를 선택해 지도에 미리보기 + 고도 그래프를 표시한다 */
    const exploreSelectRoute = async (routeId: string, routeTitle?: string) => {
        listEffect.clearPreview()
        const sections = await listEffect.selectRoute(routeId)
        if (!sections?.length) {
            elevationFacade.closeElevationChart()
            return
        }

        const sectionInputs = buildSavedSectionInputs(sections)
        const densified = await terrainFacade.terrainSampler.densifyAndSampleSections(sectionInputs)

        elevationFacade.openElevationChart(
            routeTitle ?? '경로 고도 그래프',
            createRouteElevationProfile(densified)
        )
    }

    const restartDrawing = async () => {
        drawEffect.cancelDrawing()
        await nextTick()
        await startDrawing()
        showRouteInfoGuide.value = true
    }

    const confirmSaveWithGuideReset = async () => {
        await confirmSave()
        showRouteInfoGuide.value = false
    }

    // ─── 내부 오케스트레이션 ──────────────────────────────────────

    /** 그리기 탭 진입 시 미리보기를 정리하고 드로잉을 시작한다 */
    watch(store.activeNav, async (next, prev) => {
        if (next === '그리기' && prev !== '그리기') {
            listEffect.clearPreview()
            listEffect.clearSelection()
            await nextTick()
            await startDrawing()
            showRouteInfoGuide.value = true
            return
        }

        if (prev === '그리기' && next !== '그리기') {
            drawEffect.cancelDrawing()
        }

        if (next !== '그리기' && next !== '목록') {
            elevationFacade.closeElevationChart()
        }
    })

    /** 경로 목록을 불러온다. 페이지에서 인증 상태 확인 후 호출한다. */
    const fetchRoutes = () => listEffect.fetchRoutes()

    // ─── 파생 객체 조합 ───────────────────────────────────────────

    // drawing.start를 오케스트레이터의 restartDrawing으로 교체
    drawing.start = restartDrawing
    // saveModal.confirm을 showRouteInfoGuide 리셋이 포함된 버전으로 교체
    saveModal.confirm = confirmSaveWithGuideReset

    const routeList = reactive({
        searchQuery,
        filteredRoutes,
        selectedRouteId,
        select: selectRoute,
        download: downloadRouteGpx,
        refresh: () => listEffect.fetchRoutes()
    })

    // ─── 공개 인터페이스 ──────────────────────────────────────────

    return {
        activeNav: store.activeNav,
        drawing,
        saveModal,
        routeList,
        elevationChart: elevationFacade.elevationChart,
        closing,
        exploreSelectRoute,
        optimizationMode: optimizationFacade.optimizationMode,
        isOptimizing: optimizationFacade.isOptimizing,
        hideRoutePolylines,
        showRoutePolylines,
        showRouteInfoGuide,
        fetchRoutes
    }
}
