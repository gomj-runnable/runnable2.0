import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed, nextTick } from 'vue'
import { useOverlayContext } from '~/widgets/map-shell/model/useOverlayContext'
import { MapOverlayContextEnum } from '#shared/types/map-overlay-context.enum'
import { PlaybackStateEnum } from '#shared/types/playback-state.enum'

const makeRouteInfoStore = () => ({
    isAddingRouteInfo: ref(false),
    selectedMarkerRouteInfo: ref<any>(null),
    routeInfos: ref<any[]>([]),
    localRouteInfos: ref<any[]>([])
})

const makeRouteInfoEffect = () => ({
    cancelAdding: vi.fn()
})

const makeSimulation = () => ({
    playbackState: ref(PlaybackStateEnum.STOPPED)
})

const makeSimulationEffect = () => ({
    stopPlayback: vi.fn()
})

const makeSectionInfo = () => ({
    isOpen: ref(false)
})

describe('useOverlayContext', () => {
    let opts: any

    beforeEach(() => {
        opts = {
            activeNav: ref('탐색'),
            sectionDraft: ref(null),
            selectedRouteId: ref<string | null>(null),
            exploreSelectedRouteId: ref<string | null>(null),
            showRecommend: ref(false),
            routeInfoStore: makeRouteInfoStore(),
            routeInfoEffect: makeRouteInfoEffect(),
            simulation: makeSimulation(),
            simulationEffect: makeSimulationEffect(),
            isSimDrawerOpen: ref(false),
            sectionInfo: makeSectionInfo()
        }
    })

    it('초기값 — overlayContext = NONE', () => {
        const { overlayContext } = useOverlayContext(opts)
        expect(overlayContext.value.key).toBe(MapOverlayContextEnum.NONE.key)
    })

    it('그리기 탭 + sectionDraft 있음 → DRAWING', () => {
        opts.activeNav.value = '그리기'
        opts.sectionDraft.value = { routeId: 'x' }
        const { overlayContext } = useOverlayContext(opts)
        expect(overlayContext.value.key).toBe(MapOverlayContextEnum.DRAWING.key)
    })

    it('목록 탭 + selectedRouteId(Ref) → LIST_SELECTED', () => {
        opts.activeNav.value = '목록'
        opts.selectedRouteId.value = 'r-1'
        const { overlayContext } = useOverlayContext(opts)
        expect(overlayContext.value.key).toBe(MapOverlayContextEnum.LIST_SELECTED.key)
    })

    it('selectedRouteId 가 primitive string 으로 전달돼도 동작', () => {
        opts.activeNav.value = '목록'
        opts.selectedRouteId = 'r-2'
        const { overlayContext } = useOverlayContext(opts)
        expect(overlayContext.value.key).toBe(MapOverlayContextEnum.LIST_SELECTED.key)
    })

    it('탐색 탭 + showRecommend → RECOMMEND', () => {
        opts.activeNav.value = '탐색'
        opts.showRecommend.value = true
        const { overlayContext } = useOverlayContext(opts)
        expect(overlayContext.value.key).toBe(MapOverlayContextEnum.RECOMMEND.key)
    })

    it('탐색 탭 + exploreSelectedRouteId → EXPLORE_SELECTED', () => {
        opts.activeNav.value = '탐색'
        opts.exploreSelectedRouteId.value = 'r-3'
        const { overlayContext } = useOverlayContext(opts)
        expect(overlayContext.value.key).toBe(MapOverlayContextEnum.EXPLORE_SELECTED.key)
    })

    it('showRouteInfoChip — overlayContext.hasActiveRoute 일 때만 true', () => {
        opts.activeNav.value = '목록'
        opts.selectedRouteId.value = 'r-1'
        const { showRouteInfoChip } = useOverlayContext(opts)
        expect(showRouteInfoChip.value).toBe(true)
    })

    it('showSimulationChip — 목록 탭에선 sectionInfo.isOpen 필요', () => {
        opts.activeNav.value = '목록'
        opts.selectedRouteId.value = 'r-1'
        opts.sectionInfo.isOpen.value = false
        const { showSimulationChip } = useOverlayContext(opts)
        expect(showSimulationChip.value).toBe(false)

        opts.sectionInfo.isOpen.value = true
        // computed 재평가
        expect(showSimulationChip.value).toBe(true)
    })

    it('overlayContext 가 활성 → 비활성으로 바뀌면 routeInfo/sim drawer 정리', async () => {
        opts.activeNav.value = '목록'
        opts.selectedRouteId.value = 'r-1'
        opts.routeInfoStore.isAddingRouteInfo.value = true
        opts.isSimDrawerOpen.value = true
        opts.simulation.playbackState.value = PlaybackStateEnum.PLAYING

        useOverlayContext(opts)
        await nextTick()

        // 활성 경로 해제
        opts.activeNav.value = '탐색'
        opts.selectedRouteId.value = null
        await nextTick()

        expect(opts.routeInfoEffect.cancelAdding).toHaveBeenCalled()
        expect(opts.isSimDrawerOpen.value).toBe(false)
        expect(opts.simulationEffect.stopPlayback).toHaveBeenCalled()
        expect(opts.routeInfoStore.selectedMarkerRouteInfo.value).toBeNull()
    })

    it('동일 컨텍스트 유지 시 cleanup 실행 안 함', async () => {
        opts.activeNav.value = '목록'
        opts.selectedRouteId.value = 'r-1'

        useOverlayContext(opts)
        await nextTick()

        // 같은 컨텍스트 — 다른 routeId 로 변경
        opts.selectedRouteId.value = 'r-2'
        await nextTick()

        expect(opts.routeInfoEffect.cancelAdding).not.toHaveBeenCalled()
    })
})
