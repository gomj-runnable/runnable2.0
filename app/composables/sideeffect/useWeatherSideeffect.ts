import type { ShallowRef, Ref, ComputedRef } from 'vue'
import type { CesiumViewer } from '~/composables/useWindow'
import type {
    CesiumRuntime,
    GeoJsonDataSourceInstance,
    GroundPolylinePrimitiveInstance
} from '#shared/types/cesium'
import type { GeoJsonMultiPolygon, GeoJsonPolygon, GeoJsonPosition } from '#shared/types/geojson'
import type { SeoulMonthlyWeather, HourlyWeather, WeatherLayer } from '#shared/types/weather'
import { toCartesianPosition } from '~/composables/action/useRouteDrawUtils'
import { resolvePolygonColor, toOpaqueColor } from '~/composables/action/useWeatherDataTransform'

interface UseWeatherSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    selectedDate: Ref<string>
    selectedHour: Ref<string>
    monthlyData: Ref<SeoulMonthlyWeather | null>
    boundaryGeojson: Ref<unknown>
    dailySnapshot: ComputedRef<Map<string, HourlyWeather>>
    activeLayer: Ref<WeatherLayer>
    isLoading: Ref<boolean>
    isVisible: Ref<boolean>
}

export const useWeatherSideeffect = (options: UseWeatherSideeffectOptions) => {
    const {
        viewer,
        selectedDate,
        selectedHour,
        monthlyData,
        boundaryGeojson,
        dailySnapshot,
        activeLayer,
        isLoading,
        isVisible
    } = options

    let weatherDataSource: GeoJsonDataSourceInstance | null = null
    let weatherOutlinePrimitive: GroundPolylinePrimitiveInstance | null = null
    const weatherOutlineInstances = shallowRef<Array<{ code: string; id: string }>>([])

    const getCesium = (): CesiumRuntime => (window as unknown as { Cesium: CesiumRuntime }).Cesium

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
        layer: WeatherLayer,
        code: string
    ): string => {
        const weather = resolveWeatherByCode(snapshot, code)
        return weather ? resolvePolygonColor(weather, layer) : NO_DATA_COLOR
    }

    const getPolygonRings = (
        geometry: GeoJsonPolygon | GeoJsonMultiPolygon
    ): GeoJsonPosition[][] => {
        if (geometry.type === 'Polygon') {
            return geometry.coordinates
        }

        return geometry.coordinates.flatMap((polygon) => polygon)
    }

    const buildBoundaryOutlinePrimitive = () => {
        const v = viewer.value
        if (!v || !boundaryGeojson.value) return

        const Cesium = getCesium()
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
                                positions: ring.map(toCartesianPosition),
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

    const fetchBoundary = async () => {
        try {
            const data = await $fetch('/api/boundary/seoul')
            boundaryGeojson.value = data
        } catch (err) {
            console.error('[WeatherSideeffect] boundary fetch failed', err)
        }
    }

    const fetchMonthlyWeather = async () => {
        isLoading.value = true
        try {
            const data = await $fetch<SeoulMonthlyWeather>(`/api/weather/${selectedDate.value}`)
            monthlyData.value = data
        } catch (err) {
            console.error('[WeatherSideeffect] weather fetch failed', err)
        } finally {
            isLoading.value = false
        }
    }

    // 데이터 없는 구역 표시색
    const NO_DATA_COLOR = 'rgba(80, 80, 80, 0.3)'

    const loadBoundaryDataSource = async () => {
        const v = viewer.value
        if (!v || !boundaryGeojson.value) return

        const Cesium = getCesium()
        try {
            const ds = await Cesium.GeoJsonDataSource.load(boundaryGeojson.value as object, {
                stroke: Cesium.Color.fromCssColorString('rgba(255,255,255,0.85)'),
                fill: Cesium.Color.fromCssColorString(NO_DATA_COLOR),
                strokeWidth: 2,
                clampToGround: true
            })
            await (
                v as unknown as { dataSources: { add(ds: unknown): Promise<void> } }
            ).dataSources.add(ds)
            weatherDataSource = ds
            buildBoundaryOutlinePrimitive()
        } catch (err) {
            console.error('[WeatherSideeffect] GeoJsonDataSource load failed', err)
        }
    }

    const updateCesiumPolygons = () => {
        if (!weatherDataSource || !isVisible.value) return
        const Cesium = getCesium()
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
            const outlineColor = toOpaqueColor(getLayerColor(snapshot, layer, code))
            const attributes = weatherOutlinePrimitive?.getGeometryInstanceAttributes(id)
            if (!attributes) return

            attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(
                Cesium.Color.fromCssColorString(outlineColor)
            )
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
        await Promise.all([fetchBoundary(), fetchMonthlyWeather()])
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
    return { init, clearWeatherLayer }
}
