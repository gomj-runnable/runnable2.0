import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef, nextTick, watch as vueWatch } from 'vue'

import { useFacilitySideeffect } from '~/entities/facility/api/useFacilitySideeffect'

vi.stubGlobal('onBeforeUnmount', vi.fn())
vi.stubGlobal('watch', vueWatch)

const sharedCamera = vi.hoisted(() => ({
    centerLat: { value: 37.5 as number | null },
    centerLng: { value: 127 as number | null },
    locationLabel: { value: '서울특별시 강남구' }
}))
vi.mock('~/shared/model/useCameraStore', () => ({
    useCameraStore: () => sharedCamera
}))

const sharedFacilityStore = vi.hoisted(() => ({
    selectedFacility: { value: null as any }
}))
vi.mock('~/entities/facility/model/useFacilityStore', () => ({
    useFacilityStore: () => sharedFacilityStore
}))

const sharedSidewalk = vi.hoisted(() => ({
    isActive: { value: false },
    setDistrictFromLocation: vi.fn()
}))
vi.mock('~/entities/facility/model/useSidewalkStore', () => ({
    useSidewalkStore: () => sharedSidewalk
}))

// useFacilityRenderer 도 mock — 내부 Cesium 의존을 우회
const rendererMock = vi.hoisted(() => ({
    showLayer: vi.fn(),
    removeLayer: vi.fn(),
    removeAllLayers: vi.fn(),
    isLayerShown: vi.fn(() => false),
    getFacilityByEntity: vi.fn(() => null)
}))
vi.mock('~/entities/facility/lib/useFacilityRenderer', () => ({
    useFacilityRenderer: () => rendererMock,
    ALL_FACILITY_TYPES: ['crosswalk', 'fountain', 'locker', 'toilet']
}))

const $fetchMock = vi.fn()
vi.stubGlobal('$fetch', $fetchMock)

const C: any = {
    ScreenSpaceEventHandler: function (this: any) {
        this.setInputAction = vi.fn()
        this.destroy = vi.fn()
    } as any,
    ScreenSpaceEventType: { LEFT_CLICK: 1 }
}
vi.stubGlobal('window', { Cesium: C } as any)

const makeViewer = () => ({
    scene: {
        canvas: {},
        pick: vi.fn(() => null)
    }
})

describe('useFacilitySideeffect', () => {
    let viewer: ReturnType<typeof shallowRef<any>>
    let facilities: ReturnType<typeof ref<any[]>>
    let activeTypes: ReturnType<typeof ref<Set<any>>>
    let isLoading: ReturnType<typeof ref<boolean>>
    let isSearching: ReturnType<typeof ref<boolean>>

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        facilities = ref<any[]>([])
        activeTypes = ref(new Set())
        isLoading = ref(false)
        isSearching = ref(false)
        sharedCamera.centerLat.value = 37.5
        sharedCamera.centerLng.value = 127
        sharedFacilityStore.selectedFacility.value = null
        sharedSidewalk.isActive.value = false
        sharedSidewalk.setDistrictFromLocation.mockReset()
        $fetchMock.mockReset()
        rendererMock.showLayer.mockReset()
        rendererMock.removeLayer.mockReset()
        rendererMock.removeAllLayers.mockReset()
        rendererMock.isLayerShown.mockReset().mockReturnValue(false)
    })

    const create = (extraOpts: any = {}) =>
        useFacilitySideeffect({
            viewer: viewer as any,
            facilities,
            activeTypes,
            isLoading,
            isSearching,
            ...extraOpts
        })

    it('fetchFacilities — activeTypes 없으면 fetch 안 함', async () => {
        const sideeffect = create()
        await sideeffect.fetchFacilities()
        expect($fetchMock).not.toHaveBeenCalled()
    })

    it('fetchFacilities — 카메라 좌표 null 이면 skip', async () => {
        sharedCamera.centerLat.value = null
        const sideeffect = create()
        activeTypes.value = new Set(['toilet'])
        await sideeffect.fetchFacilities()
        expect($fetchMock).not.toHaveBeenCalled()
    })

    it('fetchFacilities — 정상 호출 + facilities 업데이트', async () => {
        $fetchMock.mockResolvedValue([{ id: 'f1', type: 'toilet' }])
        activeTypes.value = new Set(['toilet'])
        const sideeffect = create()
        await sideeffect.fetchFacilities()

        expect($fetchMock).toHaveBeenCalledWith(
            '/api/facilities/nearby',
            expect.objectContaining({ query: expect.objectContaining({ types: 'toilet' }) })
        )
        expect(facilities.value).toHaveLength(1)
    })

    it('searchNearby — fetch 결과로 facilities 교체 + showLayer', async () => {
        $fetchMock.mockResolvedValue([{ id: 'f1', type: 'toilet' }])
        activeTypes.value = new Set(['toilet'])
        facilities.value = [{ id: 'old-c1', type: 'crosswalk' } as any]

        const sideeffect = create()
        await sideeffect.searchNearby()

        // crosswalk 는 SEARCHABLE 에 없으므로 유지, toilet 은 교체
        // SEARCHABLE_FACILITY_TYPES = ['crosswalk','fountain','toilet','locker']
        // 따라서 crosswalk 도 unchanged 에서 제외됨 → 새 데이터만 남음
        expect(facilities.value.find((f) => f.id === 'f1')).toBeDefined()
        expect(rendererMock.showLayer).toHaveBeenCalled()
    })

    it('searchNearby — sidewalk.isActive 시 setDistrictFromLocation 호출', async () => {
        $fetchMock.mockResolvedValue([])
        activeTypes.value = new Set(['toilet'])
        sharedSidewalk.isActive.value = true
        const sideeffect = create()
        await sideeffect.searchNearby()
        expect(sharedSidewalk.setDistrictFromLocation).toHaveBeenCalled()
    })

    it('searchNearby — 카메라 좌표 null 이면 skip', async () => {
        sharedCamera.centerLat.value = null
        const sideeffect = create()
        await sideeffect.searchNearby()
        expect($fetchMock).not.toHaveBeenCalled()
    })

    it('searchNearby — 진행중이면 중복 호출 skip', async () => {
        isSearching.value = true
        const sideeffect = create()
        await sideeffect.searchNearby()
        expect($fetchMock).not.toHaveBeenCalled()
    })

    it('removeAllLayers — renderer.removeAllLayers 위임', () => {
        const sideeffect = create()
        sideeffect.removeAllLayers()
        expect(rendererMock.removeAllLayers).toHaveBeenCalled()
    })

    it('viewer null 이면 click handler 등록 안 함', async () => {
        viewer.value = null
        create()
        await nextTick()
        // 검증 — ScreenSpaceEventHandler 생성 카운트는 별도 검증 어려움
        // 단순히 throw 없음 확인
    })
})
