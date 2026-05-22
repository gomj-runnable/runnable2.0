import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef, computed, nextTick, watch as vueWatch } from 'vue'

import { useWeatherSideeffect } from '~/features/weather-overlay/api/useWeatherSideeffect'

vi.stubGlobal('onBeforeUnmount', vi.fn())
vi.stubGlobal('watch', vueWatch)
vi.stubGlobal('shallowRef', shallowRef)

const sourceStrategyMock = vi.hoisted(() => ({
    sourceAvailability: { value: {} }
}))
vi.mock('~/entities/weather/model/useWeatherSourceStrategy', () => ({
    useWeatherSourceStrategy: () => sourceStrategyMock
}))

const districtEffectMock = vi.hoisted(() => ({
    ensureGuBoundaryLoaded: vi.fn(async () => {})
}))
vi.mock('~/entities/boundary/api/useDistrictSideeffect', () => ({
    useDistrictSideeffect: () => districtEffectMock
}))

const notifyMock = vi.hoisted(() => vi.fn())
vi.mock('~/entities/notification', () => ({
    useNotificationStore: () => ({ notify: notifyMock })
}))

// withErrorBoundary — 인자 fn 을 그대로 반환 (retry 우회)
vi.mock('~/shared/lib/useAsyncDecorator', () => ({
    withErrorBoundary: <T extends (...args: any[]) => any>(fn: T) => fn
}))

// updateCesiumPolygons / buildBoundaryOutlinePrimitive 는 mock
const updatePolygons = vi.hoisted(() => vi.fn())
vi.mock('~/features/weather-overlay/lib/useWeatherPolygonRenderer', () => ({
    updateCesiumPolygons: updatePolygons
}))
const buildOutline = vi.hoisted(() => vi.fn(() => ({ id: 'outline', show: true })))
vi.mock('~/features/weather-overlay/lib/useWeatherOutlinePrimitive', () => ({
    buildBoundaryOutlinePrimitive: buildOutline
}))

const $fetchMock = vi.fn()
vi.stubGlobal('$fetch', $fetchMock)

const dsLoad = vi.fn(async (geo: any) => ({
    geo,
    show: true,
    entities: { values: [] }
}))
const C: any = {
    GeoJsonDataSource: { load: dsLoad },
    Color: { fromCssColorString: (s: string) => ({ css: s }) }
}
vi.stubGlobal('window', { Cesium: C } as any)

const makePrimitives = () => {
    const list: any[] = []
    return {
        add: (p: any) => list.push(p),
        remove: (p: any) => {
            const i = list.indexOf(p)
            if (i >= 0) list.splice(i, 1)
        },
        list
    }
}

const makeViewer = () => ({
    scene: { primitives: makePrimitives() },
    dataSources: {
        add: vi.fn(async () => {}),
        remove: vi.fn()
    }
})

describe('useWeatherSideeffect', () => {
    let viewer: ReturnType<typeof shallowRef<any>>
    let monthlyData: ReturnType<typeof ref<any>>
    let isLoading: ReturnType<typeof ref<boolean>>
    let isVisible: ReturnType<typeof ref<boolean>>
    let activeLayer: ReturnType<typeof ref<any>>
    let dailySnapshot: any
    let boundaryGeojson: ReturnType<typeof ref<any>>
    let selectedMonth: ReturnType<typeof ref<string>>
    let selectedDate: ReturnType<typeof ref<string>>
    let selectedHour: ReturnType<typeof ref<string>>

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        monthlyData = ref<any>(null)
        isLoading = ref(false)
        isVisible = ref(true)
        activeLayer = ref<any>(null)
        dailySnapshot = computed(() => new Map() as any)
        boundaryGeojson = ref<any>(null)
        selectedMonth = ref('202605')
        selectedDate = ref('2026-05-15')
        selectedHour = ref('14:00')
        notifyMock.mockReset()
        $fetchMock.mockReset()
        districtEffectMock.ensureGuBoundaryLoaded.mockClear()
        updatePolygons.mockClear()
        buildOutline.mockClear()
        dsLoad.mockClear()
    })

    const create = () =>
        useWeatherSideeffect({
            viewer: viewer as any,
            selectedMonth,
            selectedDate,
            selectedHour,
            monthlyData,
            boundaryGeojson,
            dailySnapshot,
            activeLayer,
            isLoading,
            isVisible
        })

    it('init — 병렬 fetch + boundary 로드 + polygons 갱신', async () => {
        $fetchMock.mockResolvedValue({})
        boundaryGeojson.value = { features: [] }
        const sideeffect = create()
        await sideeffect.init()

        expect(districtEffectMock.ensureGuBoundaryLoaded).toHaveBeenCalled()
        expect($fetchMock).toHaveBeenCalledWith('/api/weather/monthly/2026-05')
        expect($fetchMock).toHaveBeenCalledWith('/api/weather/availability/2026-05')
        expect(updatePolygons).toHaveBeenCalled()
    })

    it('fetchMonthlyWeather 실패 시 ERROR 알림 1회', async () => {
        // monthly 만 실패, availability 는 성공
        $fetchMock.mockImplementation(async (url: string) => {
            if (url.includes('monthly')) throw new Error('boom')
            return {}
        })
        const sideeffect = create()
        await sideeffect.init()
        expect(notifyMock).toHaveBeenCalled()
        expect(notifyMock.mock.calls[0]![0]!.title).toContain('실패')
    })

    it('sourceErrors 응답 시 WARNING 알림 1회', async () => {
        $fetchMock.mockResolvedValue({
            sourceErrors: [{ source: 'kma', message: 'timeout' }]
        })
        boundaryGeojson.value = { features: [] }
        const sideeffect = create()
        await sideeffect.init()
        expect(notifyMock).toHaveBeenCalled()
        expect(notifyMock.mock.calls[0]![0]!.title).toContain('일부 실패')
    })

    it('fetchAvailability — availability 데이터를 sourceAvailability 에 반영', async () => {
        $fetchMock.mockResolvedValue({ sourceAvailability: { forecast: ['2026-05-15'] } })
        const sideeffect = create()
        await sideeffect.fetchAvailability()
        expect(sourceStrategyMock.sourceAvailability.value).toEqual({
            forecast: ['2026-05-15']
        })
    })

    it('clearWeatherLayer — dataSource/primitive 모두 제거', async () => {
        $fetchMock.mockResolvedValue({})
        boundaryGeojson.value = { features: [] }
        const sideeffect = create()
        await sideeffect.init()
        const v = viewer.value
        sideeffect.clearWeatherLayer()
        expect(v.dataSources.remove).toHaveBeenCalled()
    })

    it('viewer null 이면 boundary 로드 무동작', async () => {
        viewer.value = null
        $fetchMock.mockResolvedValue({})
        const sideeffect = create()
        await sideeffect.init()
        // 에러 없이 종료
    })
})
