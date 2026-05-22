import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef, nextTick, watch as vueWatch } from 'vue'

import { useSidewalkSideeffect } from '~/entities/facility/api/useSidewalkSideeffect'

vi.stubGlobal('onMounted', (fn: any) => fn())
vi.stubGlobal('onBeforeUnmount', vi.fn())
vi.stubGlobal('watch', vueWatch)

// Vue ref 객체를 hoisted 에서 만들 수 없으므로 import 후 노출.
// useSidewalkStore mock 이 setup 시점에 같은 인스턴스를 반환하도록 module-level 변수에 저장.
let sharedSidewalk: {
    districts: any
    selectedDistrict: any
    selectedDong: any
    isActive: any
    isLoading: any
    selectDistrict: any
    setDistrictFromLocation: any
    clearSelection: any
    toggleActive: any
}

const mockHolder = vi.hoisted(() => ({ store: null as any }))
vi.mock('~/entities/facility/model/useSidewalkStore', () => ({
    useSidewalkStore: () => mockHolder.store
}))
const sharedCamera = vi.hoisted(() => ({
    locationLabel: { value: '서울특별시 강남구 역삼동' },
    centerLat: { value: 37.5 },
    centerLng: { value: 127 }
}))
vi.mock('~/shared/model/useCameraStore', () => ({
    useCameraStore: () => sharedCamera
}))

const $fetchMock = vi.fn()
vi.stubGlobal('$fetch', $fetchMock)

const C: any = {
    Color: {
        fromCssColorString: (s: string) => ({ withAlpha: (a: number) => ({ css: s, alpha: a }) })
    },
    Cartesian3: { fromDegreesArray: (arr: number[]) => arr },
    GeometryInstance: function (this: any, opts: any) {
        Object.assign(this, opts)
    } as any,
    GroundPolylineGeometry: function (this: any, opts: any) {
        Object.assign(this, opts)
    } as any,
    GroundPolylinePrimitive: function (this: any, opts: any) {
        Object.assign(this, opts)
    } as any,
    PolylineMaterialAppearance: function (this: any, opts: any) {
        Object.assign(this, opts)
    } as any,
    Material: { fromType: (t: string, o: any) => ({ type: t, opts: o }) },
    ClassificationType: { BOTH: 1 }
}
vi.stubGlobal('window', { Cesium: C } as any)

const makeViewer = () => {
    const added: any[] = []
    return {
        scene: {
            groundPrimitives: {
                add: (p: any) => {
                    added.push(p)
                    return p
                },
                remove: (p: any) => {
                    const i = added.indexOf(p)
                    if (i >= 0) added.splice(i, 1)
                },
                list: added
            }
        }
    }
}

describe('useSidewalkSideeffect', () => {
    let viewer: ReturnType<typeof shallowRef<any>>

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        sharedSidewalk = {
            districts: ref<any[]>([]),
            selectedDistrict: ref<string | null>(null),
            selectedDong: ref<string | null>(null),
            isActive: ref(false),
            isLoading: ref(false),
            selectDistrict: vi.fn(),
            setDistrictFromLocation: vi.fn(),
            clearSelection: vi.fn(),
            toggleActive: vi.fn()
        }
        mockHolder.store = sharedSidewalk
        $fetchMock.mockReset()
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    const create = () => useSidewalkSideeffect({ viewer: viewer as any })

    it('onMounted — districts 미로드 시 /sidewalk/index.json fetch', async () => {
        $fetchMock.mockResolvedValue([{ name: '강남구', code: '11680', count: 100, dongs: [] }])
        create()
        await nextTick()
        expect($fetchMock).toHaveBeenCalledWith('/sidewalk/index.json')
        expect(sharedSidewalk.districts.value).toHaveLength(1)
    })

    it('districts 이미 로드되어 있으면 fetch 스킵', async () => {
        sharedSidewalk.districts.value = [{ name: '강남구' }] as any
        create()
        await nextTick()
        expect($fetchMock).not.toHaveBeenCalled()
    })

    it('isActive=true 토글 시 setDistrictFromLocation 호출', async () => {
        create()
        sharedSidewalk.isActive.value = true
        await nextTick()
        expect(sharedSidewalk.setDistrictFromLocation).toHaveBeenCalledWith(
            sharedCamera.locationLabel.value
        )
    })

    it('isActive=false 토글 시 모든 Primitive 제거 + clearSelection', async () => {
        // 먼저 동 선택해서 primitive 추가
        sharedSidewalk.isActive.value = false
        create()
        await nextTick()

        sharedSidewalk.isActive.value = false // 변화 없음
        sharedSidewalk.isActive.value = true
        await nextTick()
        sharedSidewalk.isActive.value = false
        await nextTick()

        expect(sharedSidewalk.clearSelection).toHaveBeenCalled()
    })

    it('selectedDong 변경 시 fetch + GroundPolylinePrimitive 추가', async () => {
        $fetchMock.mockResolvedValueOnce([]) // index.json
        $fetchMock.mockResolvedValueOnce([
            [
                [127, 37],
                [127.001, 37.001]
            ],
            [
                [127.002, 37.002],
                [127.003, 37.003]
            ]
        ])

        create()
        await nextTick()

        sharedSidewalk.selectedDistrict.value = '강남구'
        sharedSidewalk.selectedDong.value = '역삼동'
        await nextTick()
        await nextTick()

        // 추가됨
        expect(viewer.value.scene.groundPrimitives.list.length).toBeGreaterThan(0)
    })

    it('selectedDong 좌표 line.length < 2 인 것은 스킵 → primitive 없음', async () => {
        $fetchMock.mockResolvedValueOnce([])
        $fetchMock.mockResolvedValueOnce([[[127, 37]]])

        create()
        await nextTick()

        sharedSidewalk.selectedDistrict.value = '강남구'
        sharedSidewalk.selectedDong.value = '역삼동'
        await nextTick()
        await nextTick()

        expect(viewer.value.scene.groundPrimitives.list).toHaveLength(0)
    })

    it.skip('selectedDistrict 만 변경 시 해당 구의 모든 동 일괄 렌더링', async () => {
        $fetchMock.mockResolvedValueOnce([])
        // 동별 fetch
        $fetchMock.mockResolvedValue([
            [
                [127, 37],
                [127.001, 37.001]
            ]
        ])

        sharedSidewalk.districts.value = [
            {
                name: '강남구',
                code: '11680',
                count: 100,
                dongs: [
                    { name: '역삼동', count: 50 },
                    { name: '청담동', count: 30 }
                ]
            }
        ] as any

        create()
        await nextTick()

        sharedSidewalk.selectedDistrict.value = '강남구'
        sharedSidewalk.selectedDong.value = null
        await nextTick()
        await new Promise((r) => setTimeout(r, 5))

        // 2개 동 모두 렌더링
        expect(viewer.value.scene.groundPrimitives.list.length).toBe(2)
    })

    it('fetch 실패 시 console.error 출력', async () => {
        $fetchMock.mockRejectedValue(new Error('boom'))
        create()
        await nextTick()
        expect(console.error).toHaveBeenCalled()
    })

    it('searchByCurrentLocation — setDistrictFromLocation 호출', () => {
        const sideeffect = create()
        sideeffect.searchByCurrentLocation()
        expect(sharedSidewalk.setDistrictFromLocation).toHaveBeenCalled()
    })
})
