import type { ShallowRef, Ref, ComputedRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import type {
    CesiumRuntime,
    GeoJsonDataSourceInstance,
    GroundPolylinePrimitiveInstance
} from '#shared/types/cesium'
import type { SeoulMonthlyWeather, HourlyWeather, MonthAvailability } from '#shared/types/weather'
import type { WeatherLayerEnum } from '#shared/types/weather-layer.enum'
import { resolvePolygonColor } from '~/entities/weather/lib/useWeatherDataTransform'
import { useWeatherSourceStrategy } from '~/entities/weather/model/useWeatherSourceStrategy'
import { useDistrictSideeffect } from '~/entities/boundary/api/useDistrictSideeffect'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { withErrorBoundary } from '~/shared/lib/useAsyncDecorator'
import { useNotificationStore } from '~/entities/notification'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'
import { buildBoundaryOutlinePrimitive } from '~/features/weather-overlay/lib/useWeatherOutlinePrimitive'
import { updateCesiumPolygons } from '~/features/weather-overlay/lib/useWeatherPolygonRenderer'

type ActiveWeatherLayer = WeatherLayerEnum | null

interface UseWeatherSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    selectedMonth: Ref<string>
    selectedDate: Ref<string>
    selectedHour: Ref<string>
    monthlyData: Ref<SeoulMonthlyWeather | null>
    boundaryGeojson: Ref<unknown>
    dailySnapshot: ComputedRef<Map<string, HourlyWeather>>
    activeLayer: Ref<ActiveWeatherLayer>
    isLoading: Ref<boolean>
    isVisible: Ref<boolean>
}

export const useWeatherSideeffect = (options: UseWeatherSideeffectOptions) => {
    const {
        viewer,
        selectedMonth,
        selectedDate,
        selectedHour,
        monthlyData,
        boundaryGeojson,
        dailySnapshot,
        activeLayer,
        isLoading,
        isVisible
    } = options

    const { sourceAvailability } = useWeatherSourceStrategy()
    const { ensureGuBoundaryLoaded } = useDistrictSideeffect()
    const { notify } = useNotificationStore()

    let weatherDataSource: GeoJsonDataSourceInstance | null = null
    let weatherOutlinePrimitive: GroundPolylinePrimitiveInstance | null = null
    const weatherOutlineInstances = shallowRef<Array<{ code: string; id: string }>>([])
    const NO_DATA_COLOR = 'rgba(80, 80, 80, 0.3)'
    let weatherErrorNotified = false

    const resolveWeatherByCode = (
        snapshot: Map<string, HourlyWeather>,
        code: string
    ): HourlyWeather | undefined => {
        for (const [dongCode, daily] of snapshot) {
            if (code.startsWith(dongCode.slice(0, 5)) || dongCode.startsWith(code.slice(0, 5)))
                return daily
        }
        return undefined
    }

    const getLayerColor = (
        snapshot: Map<string, HourlyWeather>,
        layer: ActiveWeatherLayer,
        code: string
    ): string => {
        if (!layer) return NO_DATA_COLOR
        const weather = resolveWeatherByCode(snapshot, code)
        return weather ? resolvePolygonColor(weather, layer) : NO_DATA_COLOR
    }

    const _fetchMonthlyData = withErrorBoundary(
        async (month: string) => $fetch<SeoulMonthlyWeather>(`/api/weather/monthly/${month}`),
        { label: 'WeatherSideeffect', retry: 1 }
    )
    const _fetchAvailability = withErrorBoundary(
        async (month: string) => $fetch<MonthAvailability>(`/api/weather/availability/${month}`),
        { label: 'WeatherSideeffect', retry: 1 }
    )
    const _loadGeoJsonDataSource = withErrorBoundary(
        async (Cesium: CesiumRuntime, geojson: object) => {
            return await Cesium.GeoJsonDataSource.load(geojson, {
                stroke: Cesium.Color.fromCssColorString('rgba(255,255,255,0.85)'),
                fill: Cesium.Color.fromCssColorString(NO_DATA_COLOR),
                strokeWidth: 2,
                clampToGround: true
            })
        },
        { label: 'WeatherSideeffect' }
    )

    const fetchMonthlyWeather = async () => {
        isLoading.value = true
        try {
            const month = `${selectedMonth.value.slice(0, 4)}-${selectedMonth.value.slice(4)}`
            const data = await _fetchMonthlyData(month)
            monthlyData.value = data
            if (data?.sourceErrors?.length && !weatherErrorNotified) {
                weatherErrorNotified = true
                notify({
                    title: '날씨 데이터 일부 실패',
                    message: data.sourceErrors.map((e) => `[${e.source}] ${e.message}`).join('\n'),
                    tone: NotificationToneEnum.WARNING
                })
            }
        } catch {
            if (!weatherErrorNotified) {
                weatherErrorNotified = true
                notify({
                    title: '날씨 데이터 로드 실패',
                    message: '날씨 정보를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.',
                    tone: NotificationToneEnum.ERROR
                })
            }
        } finally {
            isLoading.value = false
        }
    }

    const fetchAvailability = async () => {
        const month = `${selectedMonth.value.slice(0, 4)}-${selectedMonth.value.slice(4)}`
        const data = await _fetchAvailability(month)
        if (data) sourceAvailability.value = data.sourceAvailability
    }

    const loadBoundaryDataSource = async () => {
        const v = viewer.value
        if (!v || !boundaryGeojson.value) return
        const Cesium = getCesiumRuntime()
        try {
            const ds = await _loadGeoJsonDataSource(Cesium, boundaryGeojson.value as object)
            if (!ds) return
            await (
                v as unknown as { dataSources: { add(ds: unknown): Promise<void> } }
            ).dataSources.add(ds)
            weatherDataSource = ds
            ;(ds as unknown as { show: boolean }).show = false
            weatherOutlinePrimitive = buildBoundaryOutlinePrimitive({
                viewer,
                boundaryGeojson,
                dailySnapshot,
                activeLayer,
                isVisible,
                getLayerColor,
                weatherOutlinePrimitive,
                weatherOutlineInstances
            })
        } catch {
            // 에러는 withErrorBoundary에서 로깅됨
        }
    }

    const doUpdateCesiumPolygons = () => {
        updateCesiumPolygons({
            weatherDataSource,
            weatherOutlinePrimitive,
            weatherOutlineInstances,
            dailySnapshot,
            activeLayer,
            isVisible,
            getLayerColor
        })
    }

    const clearWeatherLayer = () => {
        const v = viewer.value
        if (!v) return
        if (weatherDataSource) {
            ;(v as unknown as { dataSources: { remove(ds: unknown): void } }).dataSources.remove(
                weatherDataSource
            )
            weatherDataSource = null
        }
        if (weatherOutlinePrimitive) {
            v.scene.primitives.remove(weatherOutlinePrimitive)
            weatherOutlinePrimitive = null
        }
        weatherOutlineInstances.value = []
    }

    const init = async () => {
        await Promise.all([ensureGuBoundaryLoaded(), fetchMonthlyWeather(), fetchAvailability()])
        await loadBoundaryDataSource()
        doUpdateCesiumPolygons()
    }

    watch([selectedDate, selectedHour, activeLayer], () => doUpdateCesiumPolygons())
    watch(isVisible, (v) => {
        if (weatherDataSource) {
            ;(weatherDataSource as unknown as { show: boolean }).show = v
        }
        if (weatherOutlinePrimitive) weatherOutlinePrimitive.show = v
    })
    watch(selectedMonth, () => {
        fetchMonthlyWeather()
        fetchAvailability()
    })
    onBeforeUnmount(() => clearWeatherLayer())

    return { init, clearWeatherLayer, fetchAvailability }
}
