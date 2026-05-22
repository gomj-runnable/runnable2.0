import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef } from 'vue'

import { useCameraSideeffect } from '~/features/camera/api/useCameraSideeffect'

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
    Math: {
        toDegrees: (rad: number) => (rad * 180) / Math.PI
    },
    Cartesian2: function (this: any, x: number, y: number) {
        this.x = x
        this.y = y
    } as any,
    Ellipsoid: {
        WGS84: {
            cartesianToCartographic: (c: any) => ({
                latitude: c.lat ?? 0,
                longitude: c.lng ?? 0,
                height: c.h ?? 0
            })
        }
    }
}
vi.stubGlobal('window', { Cesium: C } as any)

const makeViewer = (overrides: Record<string, any> = {}) => {
    const moveEnd = {
        listeners: [] as Array<() => void>,
        addEventListener: function (fn: () => void) {
            this.listeners.push(fn)
        },
        removeEventListener: function (fn: () => void) {
            const i = this.listeners.indexOf(fn)
            if (i >= 0) this.listeners.splice(i, 1)
        }
    }
    return {
        camera: {
            moveEnd,
            heading: Math.PI / 2,
            pitch: -Math.PI / 4,
            positionCartographic: { height: 1500 },
            getPickRay: vi.fn(() => ({ origin: {}, direction: {} }))
        },
        scene: {
            canvas: { clientWidth: 1000, clientHeight: 800 },
            globe: {
                pick: vi.fn(() => ({ lat: (37.5 * Math.PI) / 180, lng: (127 * Math.PI) / 180 }))
            }
        },
        ...overrides
    }
}

describe('useCameraSideeffect', () => {
    let viewer: ReturnType<typeof shallowRef<any>>
    let opts: any

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        opts = {
            viewer,
            centerLat: ref<number | null>(null),
            centerLng: ref<number | null>(null),
            altitude: ref<number | null>(null),
            heading: ref<number | null>(null),
            pitch: ref<number | null>(null),
            locationLabel: ref('')
        }
        sharedDistrict.store = {
            guGeojson: ref<any>(null),
            dongGeojson: ref<any>(null)
        }
    })

    it('init — ensureGu/Dong + moveEnd 리스너 등록 + 즉시 한번 onMoveEnd', async () => {
        const sideeffect = useCameraSideeffect(opts)
        await sideeffect.init()
        expect(districtEffect.ensureGuBoundaryLoaded).toHaveBeenCalled()
        expect(districtEffect.ensureDongBoundaryLoaded).toHaveBeenCalled()
        expect(opts.altitude.value).toBe(1500)
        expect(opts.centerLat.value).toBeCloseTo(37.5, 5)
        expect(opts.centerLng.value).toBeCloseTo(127, 5)
    })

    it('heading 음수 정규화 (0~360)', async () => {
        viewer.value.camera.heading = -Math.PI / 2 // -90 degrees
        const sideeffect = useCameraSideeffect(opts)
        await sideeffect.init()
        expect(opts.heading.value).toBe(270)
    })

    it('reverseGeocode — guGeojson 미로드 → 빈 문자열', async () => {
        const sideeffect = useCameraSideeffect(opts)
        await sideeffect.init()
        expect(opts.locationLabel.value).toBe('')
    })

    it('reverseGeocode — 매칭 폴리곤이 있으면 "서울특별시 {구}"', async () => {
        sharedDistrict.store.guGeojson.value = {
            features: [
                {
                    properties: { SIG_KOR_NM: '강남구' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [126, 36],
                                [128, 36],
                                [128, 38],
                                [126, 38],
                                [126, 36]
                            ]
                        ]
                    }
                }
            ]
        }
        const sideeffect = useCameraSideeffect(opts)
        await sideeffect.init()
        expect(opts.locationLabel.value).toBe('서울특별시 강남구')
    })

    it('reverseGeocode — 동 매칭 시 "서울특별시 {구} {동}"', async () => {
        sharedDistrict.store.guGeojson.value = {
            features: [
                {
                    properties: { SIG_KOR_NM: '강남구' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [126, 36],
                                [128, 36],
                                [128, 38],
                                [126, 38],
                                [126, 36]
                            ]
                        ]
                    }
                }
            ]
        }
        sharedDistrict.store.dongGeojson.value = {
            features: [
                {
                    properties: { EMD_KOR_NM: '역삼동' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [126, 36],
                                [128, 36],
                                [128, 38],
                                [126, 38],
                                [126, 36]
                            ]
                        ]
                    }
                }
            ]
        }
        const sideeffect = useCameraSideeffect(opts)
        await sideeffect.init()
        expect(opts.locationLabel.value).toBe('서울특별시 강남구 역삼동')
    })

    it('reverseGeocode — 매칭 안 되면 "서울특별시"', async () => {
        sharedDistrict.store.guGeojson.value = {
            features: [
                {
                    properties: { SIG_KOR_NM: '강남구' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [200, 50],
                                [201, 50],
                                [201, 51],
                                [200, 51],
                                [200, 50]
                            ]
                        ]
                    }
                }
            ]
        }
        const sideeffect = useCameraSideeffect(opts)
        await sideeffect.init()
        expect(opts.locationLabel.value).toBe('서울특별시')
    })

    it('reverseGeocode — MultiPolygon geometry 도 매칭', async () => {
        sharedDistrict.store.guGeojson.value = {
            features: [
                {
                    properties: { SIG_KOR_NM: '강남구' },
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [126, 36],
                                    [128, 36],
                                    [128, 38],
                                    [126, 38],
                                    [126, 36]
                                ]
                            ]
                        ]
                    }
                }
            ]
        }
        const sideeffect = useCameraSideeffect(opts)
        await sideeffect.init()
        expect(opts.locationLabel.value).toBe('서울특별시 강남구')
    })

    it('getPickRay 실패 → 좌표 갱신 안 함', async () => {
        viewer.value.camera.getPickRay = vi.fn(() => null)
        const sideeffect = useCameraSideeffect(opts)
        await sideeffect.init()
        expect(opts.centerLat.value).toBeNull()
    })

    it('globe.pick 실패 → 좌표 갱신 안 함', async () => {
        viewer.value.scene.globe.pick = vi.fn(() => null)
        const sideeffect = useCameraSideeffect(opts)
        await sideeffect.init()
        expect(opts.centerLat.value).toBeNull()
    })

    it('destroy — 리스너 제거', async () => {
        const sideeffect = useCameraSideeffect(opts)
        await sideeffect.init()
        const initial = viewer.value.camera.moveEnd.listeners.length
        expect(initial).toBeGreaterThan(0)
        sideeffect.destroy()
        expect(viewer.value.camera.moveEnd.listeners.length).toBe(initial - 1)
    })

    it('viewer null 이면 init 후 무동작', async () => {
        viewer.value = null
        const sideeffect = useCameraSideeffect(opts)
        await sideeffect.init()
        expect(opts.altitude.value).toBeNull()
    })
})
