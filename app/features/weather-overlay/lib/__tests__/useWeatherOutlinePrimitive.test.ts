import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef, computed } from 'vue'

import {
    buildBoundaryOutlinePrimitive,
    getPolygonRings
} from '~/features/weather-overlay/lib/useWeatherOutlinePrimitive'

const C: any = {
    Cartesian3: { fromDegrees: (lng: number, lat: number, h: number) => ({ lng, lat, h }) },
    Color: {
        fromCssColorString: (s: string) => ({ css: s }),
        BLACK: { name: 'black' }
    },
    GroundPolylineGeometry: function (this: any, opts: any) {
        this.opts = opts
    } as any,
    GeometryInstance: function (this: any, opts: any) {
        Object.assign(this, opts)
    } as any,
    ColorGeometryInstanceAttribute: {
        fromColor: (c: any) => ({ color: c })
    },
    GroundPolylinePrimitive: function (this: any, opts: any) {
        Object.assign(this, opts)
        this.show = opts.show
    } as any,
    PolylineColorAppearance: function (this: any) {
        this.kind = 'polyline-color'
    } as any
}
vi.stubGlobal('window', { Cesium: C } as any)

describe('getPolygonRings()', () => {
    it('Polygon → coordinates 그대로 반환', () => {
        const geom = {
            type: 'Polygon' as const,
            coordinates: [
                [
                    [127, 37],
                    [127.1, 37.1]
                ]
            ]
        }
        expect(getPolygonRings(geom)).toEqual(geom.coordinates)
    })

    it('MultiPolygon → flat 처리', () => {
        const geom = {
            type: 'MultiPolygon' as const,
            coordinates: [
                [
                    [
                        [127, 37],
                        [127.1, 37.1]
                    ]
                ],
                [
                    [
                        [128, 38],
                        [128.1, 38.1]
                    ]
                ]
            ]
        }
        const rings = getPolygonRings(geom)
        expect(rings).toHaveLength(2)
    })
})

describe('buildBoundaryOutlinePrimitive()', () => {
    let viewer: ReturnType<typeof shallowRef<any>>
    let boundaryGeojson: ReturnType<typeof ref<any>>
    let activeLayer: ReturnType<typeof ref<any>>
    let isVisible: ReturnType<typeof ref<boolean>>
    let weatherOutlineInstances: ReturnType<typeof shallowRef<any>>
    let removedPrimitives: any[]

    const makeViewer = () => {
        removedPrimitives = []
        const added: any[] = []
        return {
            scene: {
                primitives: {
                    add: (p: any) => {
                        added.push(p)
                        return p
                    },
                    remove: (p: any) => removedPrimitives.push(p),
                    list: added
                }
            }
        }
    }

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        boundaryGeojson = ref(null)
        activeLayer = ref(null)
        isVisible = ref(true)
        weatherOutlineInstances = shallowRef<any>([])
    })

    const getLayerColor = vi.fn(() => 'rgba(255, 0, 0, 0.5)')

    const buildOptions = (overrides: any = {}) => ({
        viewer: viewer as any,
        boundaryGeojson,
        dailySnapshot: computed(() => new Map() as any),
        activeLayer,
        isVisible,
        getLayerColor,
        weatherOutlinePrimitive: null,
        weatherOutlineInstances,
        ...overrides
    })

    it('viewer 가 null 이면 null 반환', () => {
        viewer.value = null
        boundaryGeojson.value = { features: [] }
        const result = buildBoundaryOutlinePrimitive(buildOptions())
        expect(result).toBeNull()
    })

    it('boundaryGeojson 이 null 이면 null 반환', () => {
        boundaryGeojson.value = null
        const result = buildBoundaryOutlinePrimitive(buildOptions())
        expect(result).toBeNull()
    })

    it('feature 가 없으면 null 반환', () => {
        boundaryGeojson.value = { features: [] }
        const result = buildBoundaryOutlinePrimitive(buildOptions())
        expect(result).toBeNull()
    })

    it('Polygon feature → primitive 생성 + scene.primitives.add 호출', () => {
        boundaryGeojson.value = {
            features: [
                {
                    properties: { SIG_CD: '11110' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [127, 37],
                                [127.001, 37.001]
                            ]
                        ]
                    }
                }
            ]
        }
        const result = buildBoundaryOutlinePrimitive(buildOptions())
        expect(result).not.toBeNull()
        expect(viewer.value.scene.primitives.list).toHaveLength(1)
        expect(weatherOutlineInstances.value).toHaveLength(1)
        expect(weatherOutlineInstances.value[0].code).toBe('11110')
    })

    it('기존 weatherOutlinePrimitive 가 있으면 제거', () => {
        boundaryGeojson.value = {
            features: [
                {
                    properties: { SIG_CD: '11110' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [127, 37],
                                [127.001, 37.001]
                            ]
                        ]
                    }
                }
            ]
        }
        const existingPrim = { id: 'old' }
        buildBoundaryOutlinePrimitive(buildOptions({ weatherOutlinePrimitive: existingPrim }))
        expect(removedPrimitives).toContain(existingPrim)
    })

    it('geometry 가 Polygon/MultiPolygon 이 아니면 스킵', () => {
        boundaryGeojson.value = {
            features: [
                {
                    properties: { SIG_CD: 'X' },
                    geometry: { type: 'Point', coordinates: [127, 37] }
                }
            ]
        }
        const result = buildBoundaryOutlinePrimitive(buildOptions())
        expect(result).toBeNull()
    })

    it('ring.length < 2 인 ring 은 스킵', () => {
        boundaryGeojson.value = {
            features: [
                {
                    properties: { SIG_CD: 'X' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[127, 37]]]
                    }
                }
            ]
        }
        const result = buildBoundaryOutlinePrimitive(buildOptions())
        expect(result).toBeNull()
    })
})
