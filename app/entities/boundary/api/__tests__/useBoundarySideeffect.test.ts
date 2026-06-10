import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef, nextTick, watch as vueWatch } from 'vue'
import type { BoundaryGeojson } from '~/entities/boundary/lib/boundaryGeojson'

import { useBoundarySideeffect } from '~/entities/boundary/api/useBoundarySideeffect'

vi.stubGlobal('onBeforeUnmount', vi.fn())
vi.stubGlobal('watch', vueWatch)

const sharedBoundary = vi.hoisted(() => ({ store: null as any }))
vi.mock('~/entities/boundary/model/useBoundaryStore', () => ({
    useBoundaryStore: () => sharedBoundary.store
}))

// 레벨별 geojson 을 테스트에서 주입할 수 있도록 loadBoundaryGeojson 을 mock 한다.
const loaded = vi.hoisted(() => ({
    sgg: null as BoundaryGeojson | null,
    emd: null as BoundaryGeojson | null
}))
const loadMock = vi.hoisted(() => vi.fn())
vi.mock('~/entities/boundary/lib/boundaryGeojson', () => ({
    loadBoundaryGeojson: loadMock
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
        loaded.sgg = null
        loaded.emd = null
        loadMock.mockReset()
        loadMock.mockImplementation(async (level: 'sgg' | 'emd') =>
            level === 'sgg'
                ? (loaded.sgg ?? { type: 'FeatureCollection', features: [] })
                : (loaded.emd ?? { type: 'FeatureCollection', features: [] })
        )
    })

    const guGeoJson = (name = '강남구'): BoundaryGeojson => ({
        type: 'FeatureCollection',
        features: [
            {
                properties: { NAME: name, _labelPoint: [127, 37] },
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

    it('init — 두 토글 watch 초기화 (immediate false 분기, 토글 비활성)', async () => {
        const sideeffect = useBoundarySideeffect({ viewer: viewer as any })
        sideeffect.init()
        await nextTick()

        // 토글이 모두 비활성이므로 geojson 로드는 일어나지 않는다.
        expect(loadMock).not.toHaveBeenCalled()
        expect(viewer.value.entities.list).toHaveLength(0)
    })

    it('isGuActive=true → geojson 의 feature 로 entity 추가', async () => {
        loaded.sgg = guGeoJson()
        const sideeffect = useBoundarySideeffect({ viewer: viewer as any })
        sideeffect.init()

        sharedBoundary.store.isGuActive.value = true
        await nextTick()
        await nextTick()

        // polyline + label 이 entity 로 추가된다.
        expect(loadMock).toHaveBeenCalledWith('sgg')
        expect(viewer.value.entities.list.length).toBeGreaterThan(0)
    })

    it('isGuActive=true → false → entity 제거', async () => {
        loaded.sgg = guGeoJson()
        const sideeffect = useBoundarySideeffect({ viewer: viewer as any })
        sideeffect.init()

        sharedBoundary.store.isGuActive.value = true
        await nextTick()
        await nextTick()
        expect(viewer.value.entities.list.length).toBeGreaterThan(0)

        sharedBoundary.store.isGuActive.value = false
        await nextTick()
        expect(viewer.value.entities.list).toHaveLength(0)
    })

    it('MultiPolygon — 각 polygon 의 outer ring 모두 polyline entity 추가', async () => {
        loaded.sgg = {
            type: 'FeatureCollection',
            features: [
                {
                    properties: { NAME: 'X' },
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
        sideeffect.init()

        sharedBoundary.store.isGuActive.value = true
        await nextTick()
        await nextTick()
        // _labelPoint 가 없어 라벨은 생략, polyline 2개만 추가
        expect(viewer.value.entities.list.length).toBe(2)
    })

    it('feature.geometry 가 없으면 스킵', async () => {
        loaded.sgg = {
            type: 'FeatureCollection',
            features: [{ properties: { NAME: 'empty' }, geometry: null }, ...guGeoJson().features]
        }
        const sideeffect = useBoundarySideeffect({ viewer: viewer as any })
        sideeffect.init()
        sharedBoundary.store.isGuActive.value = true
        await nextTick()
        await nextTick()
        // null geometry 는 polyline 스킵. 정상 feature 의 polyline 1 + label 1 = 2
        expect(viewer.value.entities.list).toHaveLength(2)
    })

    it('isDongActive 분리 동작 (별도 레이어)', async () => {
        loaded.emd = {
            type: 'FeatureCollection',
            features: [
                {
                    properties: { NAME: '역삼동', _labelPoint: [127, 37] },
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
        sideeffect.init()
        sharedBoundary.store.isDongActive.value = true
        await nextTick()
        await nextTick()
        expect(loadMock).toHaveBeenCalledWith('emd')
        expect(viewer.value.entities.list.length).toBeGreaterThan(0)
    })
})
