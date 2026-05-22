import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef } from 'vue'

import {
    useFacilityRenderer,
    ALL_FACILITY_TYPES
} from '~/entities/facility/lib/useFacilityRenderer'
import type { Facility } from '#shared/types/facility'

// usePoiOverlay 의존 — 가벼운 mock 으로 격리
const poiOverlayMock = vi.hoisted(() => ({
    showPoi: vi.fn(),
    unshowPoi: vi.fn(),
    clear: vi.fn()
}))
vi.mock('~/shared/lib/map/usePoiOverlay', () => ({
    usePoiOverlay: () => poiOverlayMock
}))

const C: any = {
    Color: {
        fromCssColorString: (s: string) => ({ withAlpha: (a: number) => ({ css: s, alpha: a }) })
    },
    Cartesian3: { fromDegrees: (lng: number, lat: number, h: number) => ({ lng, lat, h }) },
    HeightReference: { CLAMP_TO_GROUND: 1 }
}
vi.stubGlobal('window', { Cesium: C } as any)

const makeViewer = () => {
    const added: any[] = []
    return {
        entities: {
            add: (opts: any) => {
                const e = { ...opts, show: true }
                added.push(e)
                return e
            },
            remove: (e: any) => {
                const i = added.indexOf(e)
                if (i >= 0) added.splice(i, 1)
            },
            list: added
        }
    }
}

const facility = (overrides: Partial<Facility> = {}): Facility =>
    ({
        id: 'f1',
        type: 'crosswalk',
        name: '횡단보도',
        lng: 127,
        lat: 37,
        polyline: [
            [127, 37],
            [127.001, 37.001]
        ],
        hasSignal: true,
        ...overrides
    }) as Facility

describe('useFacilityRenderer', () => {
    let viewer: ReturnType<typeof shallowRef<any>>
    let facilities: ReturnType<typeof ref<Facility[]>>

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        facilities = ref<Facility[]>([])
        poiOverlayMock.showPoi.mockReset()
        poiOverlayMock.unshowPoi.mockReset()
        poiOverlayMock.clear.mockReset()
    })

    const create = () =>
        useFacilityRenderer({
            viewer: viewer as any,
            facilities,
            onFacilitySelect: vi.fn()
        })

    describe('ALL_FACILITY_TYPES', () => {
        it('crosswalk/fountain/locker/toilet 4개', () => {
            expect(ALL_FACILITY_TYPES).toEqual(['crosswalk', 'fountain', 'locker', 'toilet'])
        })
    })

    describe('showLayer / removeLayer', () => {
        it('crosswalk — polyline ≥ 2 인 facility 만 entity 로 추가', () => {
            facilities.value = [
                facility({
                    id: 'c1',
                    polyline: [
                        [127, 37],
                        [127.001, 37.001]
                    ]
                }),
                facility({ id: 'c2', polyline: [[127, 37]] }) // polyline < 2 — 스킵
            ]
            const renderer = create()
            renderer.showLayer('crosswalk')

            // 1개 entity 만 추가
            expect(viewer.value.entities.list.length).toBe(1)
            expect(renderer.isLayerShown('crosswalk')).toBe(true)
        })

        it('non-crosswalk type — POI overlay 로 렌더링', () => {
            facilities.value = [
                facility({ id: 't1', type: 'toilet' }),
                facility({ id: 't2', type: 'toilet' }),
                facility({ id: 'f1', type: 'fountain' }) // type 다른 거 — 필터링됨
            ]
            const renderer = create()
            renderer.showLayer('toilet')
            expect(poiOverlayMock.showPoi).toHaveBeenCalledTimes(2)
        })

        it('removeLayer — entity + POI 모두 제거', () => {
            facilities.value = [facility({ id: 'c1' })]
            const renderer = create()
            renderer.showLayer('crosswalk')
            expect(renderer.isLayerShown('crosswalk')).toBe(true)

            renderer.removeLayer('crosswalk')
            expect(viewer.value.entities.list.length).toBe(0)
            expect(renderer.isLayerShown('crosswalk')).toBe(false)
        })

        it('removeLayer — POI 타입은 unshowPoi 호출', () => {
            facilities.value = [facility({ id: 't1', type: 'toilet' })]
            const renderer = create()
            renderer.showLayer('toilet')
            renderer.removeLayer('toilet')
            expect(poiOverlayMock.unshowPoi).toHaveBeenCalledWith({ id: 't1' })
        })

        it('viewer null 이면 showLayer 무동작', () => {
            viewer.value = null
            facilities.value = [facility({ id: 'c1' })]
            const renderer = create()
            renderer.showLayer('crosswalk')
            expect(poiOverlayMock.showPoi).not.toHaveBeenCalled()
        })

        it('removeAllLayers — 모든 type + POI overlay clear', () => {
            facilities.value = [
                facility({ id: 'c1', type: 'crosswalk' }),
                facility({ id: 't1', type: 'toilet' })
            ]
            const renderer = create()
            renderer.showLayer('crosswalk')
            renderer.showLayer('toilet')
            renderer.removeAllLayers()
            expect(viewer.value.entities.list).toHaveLength(0)
            expect(poiOverlayMock.clear).toHaveBeenCalled()
        })

        it('crosswalk — hasSignal=false 도 추가 (다른 색상)', () => {
            facilities.value = [facility({ id: 'c1', hasSignal: false })]
            const renderer = create()
            renderer.showLayer('crosswalk')
            expect(viewer.value.entities.list.length).toBe(1)
        })
    })

    describe('getFacilityByEntity', () => {
        it('crosswalk entity 추가 후 역참조 가능', () => {
            facilities.value = [facility({ id: 'c1' })]
            const renderer = create()
            renderer.showLayer('crosswalk')
            const entity = viewer.value.entities.list[0]
            const found = renderer.getFacilityByEntity(entity)
            expect(found?.id).toBe('c1')
        })

        it('존재하지 않는 entity 는 undefined', () => {
            const renderer = create()
            expect(renderer.getFacilityByEntity({} as any)).toBeUndefined()
        })
    })
})
