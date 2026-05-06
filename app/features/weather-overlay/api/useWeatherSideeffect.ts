import type { ShallowRef, Ref, ComputedRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import type {
    CesiumRuntime,
    GeoJsonDataSourceInstance,
    GroundPolylinePrimitiveInstance
} from '#shared/types/cesium'
import type { GeoJsonMultiPolygon, GeoJsonPolygon, GeoJsonPosition } from '#shared/types/geojson'
import type { SeoulMonthlyWeather, HourlyWeather, MonthAvailability } from '#shared/types/weather'
import type { WeatherLayerEnum } from '#shared/types/weather-layer.enum'
import { toCartesianPosition } from '~/entities/route/lib/useRouteDrawUtils'
import { resolvePolygonColor, toOpaqueColor } from '~/entities/weather/lib/useWeatherDataTransform'
import { useWeatherSourceStrategy } from '~/entities/weather/model/useWeatherSourceStrategy'
import { useDistrictSideeffect } from '~/entities/boundary/api/useDistrictSideeffect'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { withErrorBoundary } from '~/shared/lib/useAsyncDecorator'
import { useNotificationStore } from '~/entities/notification'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'

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

/**
 * 날씨 데이터를 서버에서 불러오고 Cesium 지도 위에 행정구역별 날씨 레이어를 렌더링하는 sideeffect composable.
 * GeoJSON 행정경계를 DataSource로 로드하고, 선택된 날짜·시간·레이어에 따라 폴리곤 색상을 갱신한다.
 *
 * @param options - 뷰어·날짜·날씨 데이터·레이어 상태 ref를 포함한 의존성 옵션
 */
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

    /** 행정경계 GeoJSON을 Cesium DataSource로 로드한 인스턴스 */
    let weatherDataSource: GeoJsonDataSourceInstance | null = null
    /** 행정경계 외곽선 렌더링을 위한 GroundPolylinePrimitive 인스턴스 */
    let weatherOutlinePrimitive: GroundPolylinePrimitiveInstance | null = null
    /** 외곽선 색상 업데이트를 위한 구역 코드·인스턴스 ID 매핑 목록 */
    const weatherOutlineInstances = shallowRef<Array<{ code: string; id: string }>>([])

    const resolveWeatherByCode = (
        snapshot: Map<string, HourlyWeather>,
        code: string
    ): HourlyWeather | undefined => {
        for (const [dongCode, daily] of snapshot) {
            if (code.startsWith(dongCode.slice(0, 5)) || dongCode.startsWith(code.slice(0, 5))) {
                return daily
            }
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

    const getPolygonRings = (
        geometry: GeoJsonPolygon | GeoJsonMultiPolygon
    ): GeoJsonPosition[][] => {
        if (geometry.type === 'Polygon') {
            return geometry.coordinates as GeoJsonPosition[][]
        }

        return geometry.coordinates.flatMap((polygon) => polygon) as GeoJsonPosition[][]
    }

    const buildBoundaryOutlinePrimitive = () => {
        const v = viewer.value
        if (!v || !boundaryGeojson.value) return

        const Cesium = getCesiumRuntime()
        const featureCollection = boundaryGeojson.value as {
            features?: Array<{
                properties?: Record<string, unknown>
                geometry?: GeoJsonPolygon | GeoJsonMultiPolygon | null
            }>
        }
        const snapshot = dailySnapshot.value
        const layer = activeLayer.value

        if (weatherOutlinePrimitive) {
            v.scene.primitives.remove(weatherOutlinePrimitive)
            weatherOutlinePrimitive = null
        }
        weatherOutlineInstances.value = []

        const geometryInstances: unknown[] = []

        for (const [featureIndex, feature] of (featureCollection.features ?? []).entries()) {
            const geometry = feature.geometry
            if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) {
                continue
            }

            const code = String(feature.properties?.SIG_CD ?? feature.properties?.EMD_CD ?? '')
            const outlineColor = toOpaqueColor(getLayerColor(snapshot, layer, code))

            getPolygonRings(geometry)
                .filter((ring) => ring.length >= 2)
                .forEach((ring, ringIndex) => {
                    const id = `${code || 'boundary'}-${featureIndex}-${ringIndex}`
                    geometryInstances.push(
                        new Cesium.GeometryInstance({
                            id,
                            geometry: new Cesium.GroundPolylineGeometry({
                                positions: ring.map((pos) => toCartesianPosition(Cesium, pos)),
                                width: 2
                            }),
                            attributes: {
                                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                                    Cesium.Color.fromCssColorString(outlineColor)
                                )
                            }
                        })
                    )
                    weatherOutlineInstances.value.push({ code, id })
                })
        }

        if (geometryInstances.length === 0) {
            return
        }

        weatherOutlinePrimitive = new Cesium.GroundPolylinePrimitive({
            geometryInstances,
            appearance: new Cesium.PolylineColorAppearance(),
            asynchronous: false,
            show: isVisible.value
        })
        v.scene.primitives.add(weatherOutlinePrimitive)
    }

    const { ensureGuBoundaryLoaded } = useDistrictSideeffect()
    const { notify } = useNotificationStore()

    // 데이터 없는 구역 표시색
    const NO_DATA_COLOR = 'rgba(80, 80, 80, 0.3)'

    /** 날씨 에러 알림이 이미 표시되었는지 추적 (세션 당 1회) */
    let weatherErrorNotified = false

    const _fetchMonthlyData = withErrorBoundary(
        async (month: string) => $fetch<SeoulMonthlyWeather>(`/api/weather/monthly/${month}`),
        { label: 'WeatherSideeffect', retry: 1 }
    )

    const _fetchAvailability = withErrorBoundary(
        async (month: string) => $fetch<MonthAvailability>(`/api/weather/availability/${month}`),
        { label: 'WeatherSideeffect', retry: 1 }
    )

    /** 선택된 월의 날씨 데이터를 서버에서 가져와 `monthlyData`에 저장한다. */
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

    /** 선택된 월의 소스별 가용 날짜 정보를 서버에서 가져온다. */
    const fetchAvailability = async () => {
        const month = `${selectedMonth.value.slice(0, 4)}-${selectedMonth.value.slice(4)}`
        const data = await _fetchAvailability(month)
        if (data) {
            sourceAvailability.value = data.sourceAvailability
        }
    }

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

    /** 행정경계 GeoJSON을 Cesium DataSource로 로드하고 초기 폴리곤 색상을 적용한다. */
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
            buildBoundaryOutlinePrimitive()
        } catch {
            // 에러는 withErrorBoundary에서 로깅됨 — DataSource 실패가 전체 초기화를 깨뜨리지 않도록 격리
        }
    }

    /** 선택된 날짜·시간·레이어에 따라 Cesium 폴리곤과 외곽선 색상을 갱신한다. */
    const updateCesiumPolygons = () => {
        if (!weatherDataSource) return
        if (!isVisible.value || !activeLayer.value) {
            if (weatherDataSource) {
                ;(weatherDataSource as unknown as { show: boolean }).show = false
            }
            if (weatherOutlinePrimitive) {
                weatherOutlinePrimitive.show = false
            }
            return
        }
        ;(weatherDataSource as unknown as { show: boolean }).show = true
        if (weatherOutlinePrimitive) {
            weatherOutlinePrimitive.show = true
        }
        const Cesium = getCesiumRuntime()
        const snapshot = dailySnapshot.value
        const layer = activeLayer.value

        for (const entity of weatherDataSource.entities.values) {
            if (!entity.polygon) continue

            // GeoJSON properties에서 구 코드 추출 (SIG_CD 또는 EMD_CD)
            const props = entity.properties
            const code = (props?.['SIG_CD']?.getValue() ??
                props?.['EMD_CD']?.getValue() ??
                '') as string

            const color = getLayerColor(snapshot, layer, code)

            entity.polygon.material = new Cesium.ColorMaterialProperty(
                Cesium.Color.fromCssColorString(color)
            )
        }

        weatherOutlineInstances.value.forEach(({ code, id }) => {
            if (!weatherOutlinePrimitive || !weatherOutlinePrimitive.ready) return
            const outlineColor = toOpaqueColor(getLayerColor(snapshot, layer, code))
            const attributes = weatherOutlinePrimitive.getGeometryInstanceAttributes(id)
            if (!attributes) return

            attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(
                Cesium.Color.fromCssColorString(outlineColor)
            )
        })
    }

    /** 지도에서 날씨 DataSource와 외곽선 Primitive를 모두 제거한다. */
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

    /**
     * 날씨 레이어를 초기화한다.
     * 행정경계·날씨 데이터를 병렬로 불러온 뒤 DataSource를 로드하고 폴리곤 색상을 적용한다.
     */
    const init = async () => {
        await Promise.all([ensureGuBoundaryLoaded(), fetchMonthlyWeather(), fetchAvailability()])
        await loadBoundaryDataSource()
        updateCesiumPolygons()
    }

    watch([selectedDate, selectedHour, activeLayer], () => updateCesiumPolygons())
    watch(isVisible, (v) => {
        if (weatherDataSource) {
            ;(weatherDataSource as unknown as { show: boolean }).show = v
        }
        if (weatherOutlinePrimitive) {
            weatherOutlinePrimitive.show = v
        }
    })
    watch(selectedMonth, () => {
        fetchMonthlyWeather()
        fetchAvailability()
    })

    onBeforeUnmount(() => clearWeatherLayer())

    return { init, clearWeatherLayer, fetchAvailability }
}
