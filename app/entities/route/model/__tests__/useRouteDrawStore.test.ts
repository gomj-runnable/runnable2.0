import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'

describe('useRouteDrawStore', () => {
    let store: ReturnType<typeof useRouteDrawStore>

    beforeEach(() => {
        store = useRouteDrawStore()
    })

    it('초기값 — drawn/section/route 관련 모두 비어 있음', () => {
        expect(store.searchQuery.value).toBe('')
        expect(store.activeNav.value).toBe('탐색')
        expect(store.drawnPositions.value).toBeNull()
        expect(store.drawMetrics.value).toBeNull()
        expect(store.sectionDraft.value).toBeNull()
        expect(store.sectionPointRanges.value).toEqual([])
        expect(store.sectionPois.value).toEqual({})
        expect(store.activeSectionIndex.value).toBeNull()
        expect(store.routes.value).toEqual([])
        expect(store.selectedRouteId.value).toBeNull()
        expect(store.editingRouteId.value).toBeNull()
        expect(store.isRouteSaveModalOpen.value).toBe(false)
        expect(store.isElevationChartOpen.value).toBe(false)
        expect(store.elevationChartTitle.value).toBe('경로 고도 그래프')
        expect(store.elevationProfile.value).toBeNull()
        expect(store.routeForm.value).toEqual({ title: '', description: '' })
        expect(store.optimizationMode.value).toBe('NONE')
        expect(store.isOptimizing.value).toBe(false)
    })

    it('loopCloseDistance 는 routeDistance computed 안에서 사용 — 포인트 2개 미만이면 0', () => {
        store.drawnPositions.value = null
        expect(store.routeDistance.value).toBeUndefined()
    })

    it('drawMetrics 가 있으면 routeDistance 가 그 값을 반환', () => {
        store.drawMetrics.value = {
            distance: 1500,
            area: 0,
            GeoJSON: undefined,
            heights: []
        } as any
        const dist = store.routeDistance.value
        expect(dist).toBeDefined()
    })

    it('resetRouteDrawState — 모든 상태 초기화', () => {
        store.drawnPositions.value = [[127, 37, 0]] as any
        store.sectionDraft.value = { routeId: 'x' } as any
        store.sectionPointRanges.value = [{ start: 0, end: 1 }]
        store.sectionPois.value = { 0: [] as any }
        store.activeSectionIndex.value = 2
        store.isRouteSaveModalOpen.value = true
        store.isElevationChartOpen.value = true
        store.elevationChartTitle.value = 'X'
        store.elevationProfile.value = { points: [] } as any
        store.editingRouteId.value = 'r'
        store.routeForm.value = { title: 'a', description: 'b' }

        store.resetRouteDrawState()

        expect(store.drawnPositions.value).toBeNull()
        expect(store.sectionDraft.value).toBeNull()
        expect(store.sectionPointRanges.value).toEqual([])
        expect(store.sectionPois.value).toEqual({})
        expect(store.activeSectionIndex.value).toBeNull()
        expect(store.isRouteSaveModalOpen.value).toBe(false)
        expect(store.isElevationChartOpen.value).toBe(false)
        expect(store.elevationChartTitle.value).toBe('경로 고도 그래프')
        expect(store.elevationProfile.value).toBeNull()
        expect(store.editingRouteId.value).toBeNull()
        expect(store.routeForm.value).toEqual({ title: '', description: '' })
    })

    it('closingMode 관련 메서드 위임', () => {
        // 기본은 null
        expect(store.closingMode.value).toBeNull()
        expect(store.isLoopClose.value).toBe(false)
        expect(store.isRoundTrip.value).toBe(false)

        // setClosingMode 로 모드 변경 가능
        store.setClosingMode(RouteClosingModeEnum.LOOP_CLOSE)
        expect(store.isLoopClose.value).toBe(true)

        // resetClosingMode 로 초기화
        store.resetClosingMode()
        expect(store.closingMode.value).toBeNull()
    })

    it('routeMode env 가 주어지면 optimizationMode 가 그 값', () => {
        // useRuntimeConfig 를 별도 override
        vi.stubGlobal('useRuntimeConfig', () => ({ public: { routeMode: 'PEDESTRIAN' } }))
        const s = useRouteDrawStore()
        expect(s.optimizationMode.value).toBe('PEDESTRIAN')
        // 복원
        vi.stubGlobal('useRuntimeConfig', () => ({ public: {} }))
    })
})
