import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef } from 'vue'

import { updateCesiumPolygons } from '~/features/weather-overlay/lib/useWeatherPolygonRenderer'

const C: any = {
    Color: { fromCssColorString: (s: string) => ({ css: s }) },
    ColorMaterialProperty: function (this: any, c: any) {
        this.color = c
    } as any,
    ColorGeometryInstanceAttribute: {
        toValue: (c: any) => ({ value: c })
    }
}
vi.stubGlobal('window', { Cesium: C } as any)

const makeEntity = (sigCd: string) => ({
    polygon: { material: null as any },
    properties: {
        SIG_CD: { getValue: () => sigCd }
    }
})

const makeDataSource = (entities: any[]) =>
    ({
        entities: { values: entities },
        show: true
    }) as any

describe('updateCesiumPolygons()', () => {
    let dailySnapshot: ReturnType<typeof ref<any>>
    let activeLayer: ReturnType<typeof ref<any>>
    let isVisible: ReturnType<typeof ref<boolean>>
    let weatherOutlineInstances: ReturnType<typeof shallowRef<any>>

    beforeEach(() => {
        dailySnapshot = ref(new Map())
        activeLayer = ref(null)
        isVisible = ref(true)
        weatherOutlineInstances = shallowRef<any>([])
    })

    const getLayerColor = vi.fn(() => 'rgba(255, 0, 0, 0.5)')

    it('weatherDataSource null 이면 무동작', () => {
        expect(() =>
            updateCesiumPolygons({
                weatherDataSource: null,
                weatherOutlinePrimitive: null,
                weatherOutlineInstances,
                dailySnapshot,
                activeLayer,
                isVisible,
                getLayerColor
            })
        ).not.toThrow()
    })

    it('isVisible=false → dataSource.show=false, primitive.show=false', () => {
        const ds = makeDataSource([])
        const primitive = { show: true, ready: true }
        isVisible.value = false
        updateCesiumPolygons({
            weatherDataSource: ds,
            weatherOutlinePrimitive: primitive as any,
            weatherOutlineInstances,
            dailySnapshot,
            activeLayer,
            isVisible,
            getLayerColor
        })
        expect(ds.show).toBe(false)
        expect(primitive.show).toBe(false)
    })

    it('activeLayer null → dataSource.show=false', () => {
        const ds = makeDataSource([])
        activeLayer.value = null
        updateCesiumPolygons({
            weatherDataSource: ds,
            weatherOutlinePrimitive: null,
            weatherOutlineInstances,
            dailySnapshot,
            activeLayer,
            isVisible,
            getLayerColor
        })
        expect(ds.show).toBe(false)
    })

    it('표시 가능 — 각 polygon entity 의 material 갱신', () => {
        const entity = makeEntity('11110')
        const ds = makeDataSource([entity])
        activeLayer.value = { key: 'pm10' } as any
        getLayerColor.mockReturnValue('rgba(0, 100, 0, 0.5)')

        updateCesiumPolygons({
            weatherDataSource: ds,
            weatherOutlinePrimitive: null,
            weatherOutlineInstances,
            dailySnapshot,
            activeLayer,
            isVisible,
            getLayerColor
        })
        expect(entity.polygon.material).not.toBeNull()
        expect(getLayerColor).toHaveBeenCalledWith(dailySnapshot.value, activeLayer.value, '11110')
    })

    it('polygon 없는 entity 는 스킵', () => {
        const noPolyEntity = { polygon: null, properties: {} }
        const ds = makeDataSource([noPolyEntity])
        activeLayer.value = { key: 'pm10' } as any

        expect(() =>
            updateCesiumPolygons({
                weatherDataSource: ds,
                weatherOutlinePrimitive: null,
                weatherOutlineInstances,
                dailySnapshot,
                activeLayer,
                isVisible,
                getLayerColor
            })
        ).not.toThrow()
    })

    it('weatherOutlineInstances 의 color attribute 갱신 (primitive.ready 일 때만)', () => {
        const ds = makeDataSource([])
        activeLayer.value = { key: 'pm10' } as any
        weatherOutlineInstances.value = [{ code: '11110', id: 'i-1' }]

        const attrs: any = { color: null }
        const primitive = {
            show: false,
            ready: true,
            getGeometryInstanceAttributes: vi.fn(() => attrs)
        }

        updateCesiumPolygons({
            weatherDataSource: ds,
            weatherOutlinePrimitive: primitive as any,
            weatherOutlineInstances,
            dailySnapshot,
            activeLayer,
            isVisible,
            getLayerColor
        })
        expect(primitive.getGeometryInstanceAttributes).toHaveBeenCalledWith('i-1')
        expect(attrs.color).not.toBeNull()
    })

    it('primitive.ready=false 이면 outline attribute 갱신 스킵', () => {
        const ds = makeDataSource([])
        activeLayer.value = { key: 'pm10' } as any
        weatherOutlineInstances.value = [{ code: '11110', id: 'i-1' }]

        const primitive = {
            show: false,
            ready: false,
            getGeometryInstanceAttributes: vi.fn()
        }

        updateCesiumPolygons({
            weatherDataSource: ds,
            weatherOutlinePrimitive: primitive as any,
            weatherOutlineInstances,
            dailySnapshot,
            activeLayer,
            isVisible,
            getLayerColor
        })
        expect(primitive.getGeometryInstanceAttributes).not.toHaveBeenCalled()
    })
})
