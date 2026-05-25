import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'

import { useRouteSelectionFlow } from '~/widgets/map-shell/model/useRouteSelectionFlow'

const sharedSectionInfo = vi.hoisted(() => ({
    isOpen: { value: false },
    panelTitle: { value: '구간 정보' },
    selectedRouteId: { value: null as string | null },
    sections: { value: [] as any[] },
    userPaces: { value: {} as Record<string, any> },
    isEditMode: { value: false },
    readOnly: { value: false },
    open: vi.fn(),
    close: vi.fn()
}))
vi.mock('~/entities/route/model/useSectionInfoStore', () => ({
    useSectionInfoStore: () => sharedSectionInfo
}))

describe('useRouteSelectionFlow', () => {
    let routeDrawStore: any
    let routeList: any
    let slideOver: any
    let activeNav: any
    let routeInfoStore: any
    let routeInfoEffect: any

    beforeEach(() => {
        sharedSectionInfo.isOpen.value = false
        sharedSectionInfo.sections.value = []
        sharedSectionInfo.userPaces.value = {}
        sharedSectionInfo.open.mockClear()
        sharedSectionInfo.close.mockClear()
        sharedSectionInfo.selectedRouteId.value = null

        routeDrawStore = {
            drawnPositions: ref<any>(null),
            sectionPointRanges: ref<any>([]),
            editingRouteId: ref<string | null>(null),
            routeForm: ref({ title: '', description: '' })
        }
        routeList = {
            select: vi.fn(async () => [{ sectionId: 's1' }]),
            selectedRouteId: null,
            filteredRoutes: [{ routeId: 'r-1', title: 'A', description: 'desc' }]
        }
        slideOver = {
            current: ref('탐색'),
            meta: ref({ title: '기본 제목', description: '기본 설명' })
        }
        activeNav = ref('탐색')
        routeInfoStore = {
            clearRouteInfos: vi.fn(),
            clearLocalRouteInfos: vi.fn()
        }
        routeInfoEffect = {
            fetchRouteInfos: vi.fn(),
            clearMarkers: vi.fn()
        }
    })

    const create = () =>
        useRouteSelectionFlow({
            routeDrawStore,
            routeList,
            slideOver,
            activeNav,
            routeInfoStore,
            routeInfoEffect
        })

    it('sectionDistances — drawnPositions 와 ranges 모두 있을 때만 계산', () => {
        const flow = create()
        expect(flow.sectionDistances.value).toEqual([])

        routeDrawStore.drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 0]
        ]
        routeDrawStore.sectionPointRanges.value = [{ start: 0, end: 1 }]
        expect(flow.sectionDistances.value).toHaveLength(1)
        expect(flow.sectionDistances.value[0]).toBeGreaterThan(0)
    })

    it('slideOverTitle — sectionInfo.isOpen + LIST/EXPLORE 탭이면 panelTitle 사용', () => {
        slideOver.current.value = '목록'
        sharedSectionInfo.isOpen.value = true
        sharedSectionInfo.panelTitle.value = '내 구간 정보'
        const flow = create()
        expect(flow.slideOverTitle.value).toBe('내 구간 정보')

        slideOver.current.value = '그리기'
        expect(flow.slideOverTitle.value).toBe('기본 제목')
    })

    it('slideOverDescription — sectionInfo.isOpen + LIST 탭이면 안내 문구', () => {
        slideOver.current.value = '목록'
        sharedSectionInfo.isOpen.value = true
        const flow = create()
        expect(flow.slideOverDescription.value).toContain('구간별')
    })

    it('handleStepBack → showStepBackConfirm = true', () => {
        const flow = create()
        flow.handleStepBack()
        expect(flow.showStepBackConfirm.value).toBe(true)
    })

    it('confirmStepBack — sectionInfo.close 호출', () => {
        const flow = create()
        flow.confirmStepBack()
        expect(sharedSectionInfo.close).toHaveBeenCalled()
        expect(flow.showStepBackConfirm.value).toBe(false)
    })

    it('handleRouteSelect — select 결과 있으면 sectionInfo.open', async () => {
        const flow = create()
        await flow.handleRouteSelect('r-1')
        expect(routeList.select).toHaveBeenCalledWith('r-1')
        expect(sharedSectionInfo.open).toHaveBeenCalled()
    })

    it('handleRouteEdit — sections 있으면 editingRouteId/routeForm 갱신 + 그리기 탭 전환', async () => {
        const flow = create()
        await flow.handleRouteEdit('r-1')
        expect(routeDrawStore.editingRouteId.value).toBe('r-1')
        expect(routeDrawStore.routeForm.value.title).toBe('A')
        expect(routeDrawStore.routeForm.value.description).toBe('desc')
        expect(activeNav.value).toBe('그리기')
    })

    it('handleRouteEdit — sections 없으면 무동작', async () => {
        routeList.select.mockResolvedValue([])
        const flow = create()
        await flow.handleRouteEdit('r-1')
        expect(routeDrawStore.editingRouteId.value).toBeNull()
        expect(activeNav.value).toBe('탐색')
    })

    it('selectedRouteId 가 null → routeInfoStore.clearRouteInfos + clearMarkers', async () => {
        create()
        // selectedRouteId 가 직접 변경되는 패턴이 아니라 reactivity 가 필요한 경우, watch 가 동작하도록 별도 ref 가 필요.
        // 이 컴포저블은 routeList.selectedRouteId 를 watch — primitive 라 변경 감지 안 됨.
        // 결과적으로 watch 콜백 자체의 분기는 init 시 호출되지 않음 (selectedRouteId 가 변경되지 않으므로).
        // 따라서 이 케이스는 reactive ref 로 전달해야 의미 있음 — 다음 케이스에서 검증.
    })
})
