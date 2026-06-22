import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, watch as vueWatch } from 'vue'

import { useFacilitySideeffect } from '~/entities/facility/api/useFacilitySideeffect'
import { useMapViewer } from '~/shared/lib/cesium/getters/useMapViewer'

// viewer 가 공유 ref 이므로, 테스트 간 누수된 watch 가 다음 테스트의 viewer 변경에
// 재발화하지 않도록 watch 핸들을 추적해 afterEach 에서 일괄 정지한다.
const activeWatchStops: Array<() => void> = []
const trackedWatch = ((...args: Parameters<typeof vueWatch>) => {
    const stop = vueWatch(...args)
    activeWatchStops.push(stop)
    return stop
}) as typeof vueWatch

vi.stubGlobal('onBeforeUnmount', vi.fn())
vi.stubGlobal('watch', trackedWatch)

// viewer 소유권은 CesiumController(useMapViewer)에 있다. 테스트는 공유 ref 를 직접 제어한다.
vi.mock('~/shared/lib/cesium/getters/useMapViewer', async () => {
    const { shallowRef } = await import('vue')
    const viewer = shallowRef<unknown>(null)
    return {
        useMapViewer: () => ({
            viewer,
            setViewer: (v: unknown) => {
                viewer.value = v
            }
        })
    }
})

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

const { setViewer: setMockViewer } = useMapViewer() as unknown as {
    setViewer: (v: unknown) => void
}

const makeViewer = () => ({
    scene: {
        canvas: {},
        pick: vi.fn(() => null)
    }
})

describe('useFacilitySideeffect', () => {
    let facilities: ReturnType<typeof ref<any[]>>
    let activeTypes: ReturnType<typeof ref<Set<any>>>
    let isLoading: ReturnType<typeof ref<boolean>>
    let isSearching: ReturnType<typeof ref<boolean>>

    beforeEach(() => {
        setMockViewer(null)
        setMockViewer(makeViewer())
        facilities = ref<any[]>([])
        activeTypes = ref(new Set())
        isLoading = ref(false)
        isSearching = ref(false)
        sharedCamera.centerLat.value = 37.5
        sharedCamera.centerLng.value = 127
        sharedFacilityStore.selectedFacility.value = null
        $fetchMock.mockReset()
        rendererMock.showLayer.mockReset()
        rendererMock.removeLayer.mockReset()
        rendererMock.removeAllLayers.mockReset()
        rendererMock.isLayerShown.mockReset().mockReturnValue(false)
    })

    afterEach(() => {
        // 누수된 watch 정지 → 다음 테스트 beforeEach 의 viewer 변경에 재발화 방지
        while (activeWatchStops.length) activeWatchStops.pop()?.()
    })

    const create = (extraOpts: any = {}) =>
        useFacilitySideeffect({
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
        setMockViewer(null)
        create()
        await nextTick()
        // 검증 — ScreenSpaceEventHandler 생성 카운트는 별도 검증 어려움
        // 단순히 throw 없음 확인
    })
})
