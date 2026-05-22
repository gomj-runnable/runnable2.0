import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref, computed } from 'vue'

import { useExploreRouteActions } from '~/features/explore/model/useExploreRouteActions'
import { FILTER_ALL } from '~/features/explore/model/useExploreFilterStore'

// 의존 외부 모듈 mock
vi.mock('~/entities/boundary/api/useDistrictSideeffect', () => ({
    useDistrictSideeffect: () => ({ load: vi.fn() })
}))

// useDistrictStore 를 hoisted mock 으로 교체 — 테스트가 직접 guNames/dongMap 을 주입할 수 있도록.
const districtMock = vi.hoisted(() => ({
    data: { value: null as any },
    guList: { value: [] as any[] },
    guNames: { value: [] as string[] },
    guByName: { value: new Map() },
    dongMap: { value: {} as Record<string, string[]> },
    getDongList: vi.fn((name: string) => [] as string[]),
    guGeojson: { value: null as any },
    dongGeojson: { value: null as any }
}))
vi.mock('~/entities/boundary/model/useDistrictStore', () => ({
    useDistrictStore: () => districtMock
}))

const $fetchMock = vi.fn()
vi.stubGlobal('$fetch', $fetchMock)

describe('useExploreRouteActions', () => {
    const exploreSelectRoute = vi.fn(async () => {})
    const sectionInfoOpen = vi.fn()
    const sectionInfoClose = vi.fn()
    const stopSimForRouteChange = vi.fn()
    const routeListRefresh = vi.fn(async () => {})
    const notificationNotify = vi.fn()

    const buildExplore = () => ({
        filter: { selectedSigungu: ref(FILTER_ALL) },
        searchResults: ref<any[]>([{ routeId: 'r-1', title: 'A' }]),
        isSearching: ref(false),
        searchQuery: ref(''),
        selectRoute: vi.fn(),
        search: vi.fn(),
        fetchSections: vi.fn(async () => [{ sectionId: 's-1' }])
    })

    beforeEach(() => {
        $fetchMock.mockReset()
        exploreSelectRoute.mockClear()
        sectionInfoOpen.mockClear()
        sectionInfoClose.mockClear()
        stopSimForRouteChange.mockClear()
        routeListRefresh.mockClear()
        notificationNotify.mockClear()
        districtMock.guNames.value = []
        districtMock.dongMap.value = {}
        districtMock.getDongList.mockReset().mockReturnValue([])
    })

    function createActions(activeNav = ref('탐색'), explore = buildExplore()) {
        const sectionInfo = { open: sectionInfoOpen, close: sectionInfoClose }
        return {
            actions: useExploreRouteActions({
                activeNav,
                explore,
                exploreSelectRoute,
                sectionInfo,
                routeList: { refresh: routeListRefresh },
                stopSimulationForRouteChange: stopSimForRouteChange,
                notification: { notify: notificationNotify }
            }),
            explore,
            activeNav
        }
    }

    it('sigunguOptions — FILTER_ALL + districtStore.guNames', () => {
        districtMock.guNames.value = ['강남구', '종로구']
        const { actions } = createActions()
        expect(actions.sigunguOptions.value).toEqual([FILTER_ALL, '강남구', '종로구'])
    })

    it('dongOptions — sigungu=FILTER_ALL 이면 [FILTER_ALL] 만', () => {
        const { actions } = createActions()
        expect(actions.dongOptions.value).toEqual([FILTER_ALL])
    })

    it('dongOptions — sigungu 선택 시 그 구의 동 목록', () => {
        districtMock.getDongList.mockReturnValue(['역삼동', '청담동'])

        const explore = buildExplore()
        explore.filter.selectedSigungu.value = '강남구'
        const { actions } = createActions(ref('탐색'), explore)
        expect(actions.dongOptions.value).toEqual([FILTER_ALL, '역삼동', '청담동'])
    })

    it('handleExploreSelect — 경로 선택 + 구간 fetch + sectionInfo.open', async () => {
        const { actions, explore } = createActions()
        await actions.handleExploreSelect('r-1')

        expect(stopSimForRouteChange).toHaveBeenCalled()
        expect(explore.selectRoute).toHaveBeenCalledWith('r-1')
        expect(exploreSelectRoute).toHaveBeenCalledWith('r-1', 'A')
        expect(sectionInfoOpen).toHaveBeenCalledWith(
            'r-1',
            expect.any(Array),
            expect.objectContaining({ readOnly: true, title: 'A' })
        )
    })

    it('handleExploreSelect — fetchSections 실패해도 throw 안 함', async () => {
        const explore = buildExplore()
        explore.fetchSections = vi.fn(async () => {
            throw new Error('boom')
        })
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const { actions } = createActions(ref('탐색'), explore)
        await expect(actions.handleExploreSelect('r-1')).resolves.toBeUndefined()
    })

    it('handleExploreImport — 성공 시 SUCCESS notify', async () => {
        $fetchMock.mockResolvedValue({ routeId: 'forked' })
        const { actions } = createActions()
        await actions.handleExploreImport('r-1')
        expect(routeListRefresh).toHaveBeenCalled()
        expect(notificationNotify.mock.calls[0]![0]!.title).toContain('가져오기 완료')
    })

    it('handleExploreImport — 실패 시 WARNING notify, 서버 message 우선', async () => {
        $fetchMock.mockRejectedValue({ data: { message: '이미 포크된 경로' } })
        const { actions } = createActions()
        await actions.handleExploreImport('r-1')
        expect(notificationNotify.mock.calls[0]![0]!.message).toBe('이미 포크된 경로')
    })

    it('activeNav watch — 탐색 진입 시 explore.search 호출 (results 비어 있을 때만)', async () => {
        const explore = buildExplore()
        explore.searchResults.value = []
        const activeNav = ref('초기')
        createActions(activeNav, explore)

        activeNav.value = '탐색'
        await nextTick()
        expect(explore.search).toHaveBeenCalledWith('')
    })

    it('activeNav watch — 다른 탭으로 이동 시 sectionInfo.close', async () => {
        const activeNav = ref('탐색')
        createActions(activeNav)
        activeNav.value = '기타'
        await nextTick()
        expect(sectionInfoClose).toHaveBeenCalled()
    })
})
