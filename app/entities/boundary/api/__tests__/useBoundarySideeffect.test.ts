import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef, nextTick, watch as vueWatch } from 'vue'

import { useBoundarySideeffect } from '~/entities/boundary/api/useBoundarySideeffect'

vi.stubGlobal('onBeforeUnmount', vi.fn())
vi.stubGlobal('watch', vueWatch)

const sharedBoundary = vi.hoisted(() => ({ store: null as any }))
vi.mock('~/entities/boundary/model/useBoundaryStore', () => ({
    useBoundaryStore: () => sharedBoundary.store
}))

const sharedDistrict = vi.hoisted(() => ({ store: null as any }))
vi.mock('~/entities/boundary/model/useDistrictStore', () => ({
    useDistrictStore: () => sharedDistrict.store
}))

const districtEffect = vi.hoisted(() => ({
    ensureGuBoundaryLoaded: vi.fn(async () => {}),
    ensureDongBoundaryLoaded: vi.fn(async () => {})
}))
vi.mock('~/entities/boundary/api/useDistrictSideeffect', () => ({
    useDistrictSideeffect: () => districtEffect
}))

const C: any = {
    Color: {
        fromCssColorString: (s: string) => ({ withAlpha: (a: number) => ({ css: s, alpha: a }) }),
        BLACK: { name: 'black' }
    },
    Cartesian3: {
        fromDegrees: (lng: number, lat: number) => ({ lng, lat }),
        fromDegreesArray: (arr: number[]) => arr
    },
    LabelStyle: { FILL_AND_OUTLINE: 1 },
    VerticalOrigin: { CENTER: 1 },
    HorizontalOrigin: { CENTER: 1 }
}
vi.stubGlobal('window', { Cesium: C } as any)

const makeViewer = () => {
    const added: any[] = []
    return {
        entities: {
            add: (opts: any) => {
                added.push({ ...opts, show: true })
                return added[added.length - 1]
            },
            remove: (e: any) => {
                const i = added.indexOf(e)
                if (i >= 0) added.splice(i, 1)
            },
            list: added
        }
    }
}

describe('useBoundarySideeffect', () => {
    let viewer: ReturnType<typeof shallowRef<any>>

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        sharedBoundary.store = {
            isGuActive: ref(false),
            isDongActive: ref(false),
            toggleGu: vi.fn(),
            toggleDong: vi.fn()
        }
        sharedDistrict.store = {
            guGeojson: ref<any>(null),
            dongGeojson: ref<any>(null)
        }
        districtEffect.ensureGuBoundaryLoaded.mockClear()
        districtEffect.ensureDongBoundaryLoaded.mockClear()
    })

    const guGeoJson = (sigCd = '11680', name = '강남구') => ({
        features: [
            {
                properties: { SIG_KOR_NM: name, SIG_CD: sigCd },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [127, 37],
                            [127.01, 37],
                            [127.01, 37.01],
                            [127, 37.01],
                            [127, 37]
                        ]
                    ]
                }
            }
        ]
    })

    it('init — ensureGu/Dong + 두 토글 watch 초기화 (immediate false 분기)', async () => {
        const sideeffect = useBoundarySideeffect({ viewer: viewer as any })
        await sideeffect.init()

        expect(districtEffect.ensureGuBoundaryLoaded).toHaveBeenCalled()
        expect(districtEffect.ensureDongBoundaryLoaded).toHaveBeenCalled()
    })

    it('isGuActive=true → guGeojson 의 feature 로 entity 추가', async () => {
        sharedDistrict.store.guGeojson.value = guGeoJson()
        const sideeffect = useBoundarySideeffect({ viewer: viewer as any })
        await sideeffect.init()

        sharedBoundary.store.isGuActive.value = true
        await nextTick()

        // polyline + polygon + label 이 하나의 entity 로 추가
        expect(viewer.value.entities.list.length).toBeGreaterThan(0)
    })

    it('isGuActive=true → false → entity 제거', async () => {
        sharedDistrict.store.guGeojson.value = guGeoJson()
        const sideeffect = useBoundarySideeffect({ viewer: viewer as any })
        await sideeffect.init()

        sharedBoundary.store.isGuActive.value = true
        await nextTick()
        expect(viewer.value.entities.list.length).toBeGreaterThan(0)

        sharedBoundary.store.isGuActive.value = false
        await nextTick()
        expect(viewer.value.entities.list).toHaveLength(0)
    })

    it('MultiPolygon — 각 polygon 의 outer ring 모두 entity 추가', async () => {
        sharedDistrict.store.guGeojson.value = {
            features: [
                {
                    properties: { SIG_KOR_NM: 'X' },
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [127, 37],
                                    [127.01, 37],
                                    [127, 37.01],
                                    [127, 37]
                                ]
                            ],
                            [
                                [
                                    [128, 38],
                                    [128.01, 38],
                                    [128, 38.01],
                                    [128, 38]
                                ]
                            ]
                        ]
                    }
                }
            ]
        }
        const sideeffect = useBoundarySideeffect({ viewer: viewer as any })
        await sideeffect.init()

        sharedBoundary.store.isGuActive.value = true
        await nextTick()
        expect(viewer.value.entities.list.length).toBe(2)
    })

    it('feature.geometry 가 없으면 스킵', async () => {
        sharedDistrict.store.guGeojson.value = {
            features: [{ properties: {}, geometry: null }, ...guGeoJson().features]
        }
        const sideeffect = useBoundarySideeffect({ viewer: viewer as any })
        await sideeffect.init()
        sharedBoundary.store.isGuActive.value = true
        await nextTick()
        // null geometry 는 스킵, 정상 feature 만 추가
        expect(viewer.value.entities.list).toHaveLength(1)
    })

    it('isDongActive 분리 동작 (별도 레이어)', async () => {
        sharedDistrict.store.dongGeojson.value = {
            features: [
                {
                    properties: { name: '역삼동' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [127, 37],
                                [127.01, 37],
                                [127, 37.01],
                                [127, 37]
                            ]
                        ]
                    }
                }
            ]
        }
        const sideeffect = useBoundarySideeffect({ viewer: viewer as any })
        await sideeffect.init()
        sharedBoundary.store.isDongActive.value = true
        await nextTick()
        expect(viewer.value.entities.list.length).toBeGreaterThan(0)
    })
})
