import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/composables/useWindow'
import { RouteDraftBuilder, createSectionSchema } from '#shared/schemas/route.schema'
import { useRouteDrawStore } from '~/composables/store/useRouteDrawStore'
import {
    createHeightAwareRouteGeom,
    createSectionDraftsFromRanges
} from '~/composables/action/useRouteDrawDraft'
import useRouteDrawSideeffect from '~/composables/sideeffect/useRouteDrawSideeffect'
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

    const listEffect = useRouteListSideeffect({
        viewer,
        routes: store.routes,
        selectedRouteId: store.selectedRouteId
    })

    // ─── 내부 오케스트레이션 ──────────────────────────────────────

    /** 그리기 탭 진입 시 미리보기를 정리하고 드로잉을 시작한다 */
    watch(store.activeNav, async (next, prev) => {
        if (next === '그리기' && prev !== '그리기') {
            listEffect.clearPreview()
            listEffect.clearSelection()
            await nextTick()
            await drawEffect.handleDrawReset()
            return
        }

        if (prev === '그리기' && next !== '그리기') {
            drawEffect.cancelDrawing()
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
        await drawEffect.handleDrawReset()
    }

    // ─── 공개 액션: 그리기 ────────────────────────────────────────

    /**
     * 기존 드로잉을 초기화하고 새 경로 그리기를 시작한다.
     * DrawRoutePanel의 "그리기" 버튼에 연결한다.
     */
    const startDrawing = () => restartDrawing()

    /**
     * 드로잉된 경로의 유효성을 검사하고 저장 모달을 연다.
     * DrawRoutePanel의 "저장" 버튼에 연결한다.
     */
    const openSaveModal = () => drawEffect.handleDrawSave()

    /**
     * 구간의 속성(이름·코멘트·설명)을 수정한다.
     * DrawRoutePanel의 입력 필드 변경 이벤트에 연결한다.
     */
    const updateSectionAttr = drawEffect.handleUpdateSectionAttr

    /**
     * 특정 구간을 삭제하고 인접 구간과 병합한다.
     * DrawRoutePanel의 구간 삭제 버튼에 연결한다.
     */
    const removeSection = drawEffect.handleRemoveSection

    // ─── 공개 액션: 저장 ──────────────────────────────────────────

    /**
     * 저장 모달에서 "저장" 버튼 클릭 시 경로를 확정 저장한다.
     * 저장 성공 후 목록을 갱신하고 드로잉 상태를 초기화한다.
     */
    const confirmSave = async () => {
        if (!store.sectionDraft.value) {
            alert('먼저 구간을 그려주세요.')
            return
        }

        if (!store.drawnPositions.value?.length) {
            alert('경로 포인트가 없습니다.')
            return
        }

        try {
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

            await saveEffect.saveRoute(routeDraftPayload, sectionPayloads)
            await listEffect.fetchRoutes()

            store.isRouteSaveModalOpen.value = false
            store.resetRouteDrawState()
            store.activeNav.value = '목록'
            alert('저장되었습니다.')
        } catch (error) {
            alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
        }
    }

    // ─── 공개 액션: 경로 목록 ─────────────────────────────────────

    /**
     * 경로 카드를 클릭해 선택하고 해당 구간을 지도에 표시한다.
     * 이미 선택된 경로를 다시 클릭하면 선택을 해제하고 미리보기를 지운다.
     */
    const selectRoute = listEffect.selectRoute

    // ─── 공개 인터페이스 ──────────────────────────────────────────

    return {
        // 상태: 검색 및 내비게이션
        searchQuery: store.searchQuery,
        activeNav: store.activeNav,

        // 상태: 경로 목록
        filteredRoutes,
        selectedRouteId: store.selectedRouteId,

        // 상태: 드로잉
        sectionDraft: store.sectionDraft,

        // 상태: 저장 모달
        isRouteSaveModalOpen: store.isRouteSaveModalOpen,
        routeForm: store.routeForm,
        routeDistance: store.routeDistance,

        // 액션: 그리기
        startDrawing,
        openSaveModal,
        updateSectionAttr,
        removeSection,

        // 액션: 저장
        confirmSave,

        // 액션: 경로 목록
        selectRoute
    }
}
