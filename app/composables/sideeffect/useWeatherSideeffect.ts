import type { ShallowRef, Ref, ComputedRef } from 'vue'
import type { CesiumEntity, CesiumViewer } from '~/composables/useWindow'
import type { CesiumRuntime, GeoJsonDataSourceInstance } from '#shared/types/cesium'
import type { GeoJsonMultiPolygon, GeoJsonPolygon, GeoJsonPosition } from '#shared/types/geojson'
import type { SeoulMonthlyWeather, DailyWeather, WeatherLayer } from '#shared/types/weather'
import { toCartesianPosition } from '~/composables/action/useRouteDrawUtils'
import { resolvePolygonColor, toOpaqueColor } from '~/composables/action/useWeatherDataTransform'

interface UseWeatherSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    selectedDate: Ref<string>
    selectedMonth: Ref<string>
    monthlyData: Ref<SeoulMonthlyWeather | null>
    boundaryGeojson: Ref<unknown>
    dailySnapshot: ComputedRef<Map<string, DailyWeather>>
    activeLayer: Ref<WeatherLayer>
    isLoading: Ref<boolean>
    isVisible: Ref<boolean>
}

export const useWeatherSideeffect = (options: UseWeatherSideeffectOptions) => {
    const {
        viewer,
        selectedDate,
        selectedMonth,
        monthlyData,
        boundaryGeojson,
        dailySnapshot,
        activeLayer,
        isLoading,
        isVisible
    } = options

    let weatherDataSource: GeoJsonDataSourceInstance | null = null
    const weatherOutlinePolylines = shallowRef<Array<{ code: string; entity: CesiumEntity }>>([])

    const getCesium = (): CesiumRuntime => (window as unknown as { Cesium: CesiumRuntime }).Cesium

    const resolveWeatherByCode = (
        snapshot: Map<string, DailyWeather>,
        code: string
    ): DailyWeather | undefined => {
        for (const [dongCode, daily] of snapshot) {
            if (code.startsWith(dongCode.slice(0, 5)) || dongCode.startsWith(code.slice(0, 5))) {
                return daily
            }
        }

        return undefined
    }

    const getLayerColor = (
        snapshot: Map<string, DailyWeather>,
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

    const buildBoundaryOutlinePolylines = () => {
        const v = viewer.value
        if (!v || !boundaryGeojson.value) return

        const featureCollection = boundaryGeojson.value as {
            features?: Array<{
                properties?: Record<string, unknown>
                geometry?: GeoJsonPolygon | GeoJsonMultiPolygon | null
            }>
        }
        const snapshot = dailySnapshot.value
        const layer = activeLayer.value

        weatherOutlinePolylines.value.forEach(({ entity }) => v.entities.remove(entity))
        weatherOutlinePolylines.value = []

        for (const feature of featureCollection.features ?? []) {
            const geometry = feature.geometry
            if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) {
                continue
            }

            const code = String(feature.properties?.SIG_CD ?? feature.properties?.EMD_CD ?? '')
            const outlineColor = toOpaqueColor(getLayerColor(snapshot, layer, code))

            const polylineEntities = getPolygonRings(geometry)
                .filter((ring) => ring.length >= 2)
                .map((ring) =>
                    v.entities.add({
                        polyline: {
                            positions: ring.map(toCartesianPosition),
                            width: 2,
                            clampToGround: true,
                            material: window.Cesium.Color.fromCssColorString(outlineColor)
                        }
                    })
                )

            weatherOutlinePolylines.value.push(
                ...polylineEntities.map((entity) => ({ code, entity }))
            )
        }
    }

    const fetchBoundary = async () => {
        try {
            const data = await $fetch('/api/boundary/seoul')
            boundaryGeojson.value = data
        } catch (err) {
            console.error('[WeatherSideeffect] boundary fetch failed', err)
        }
    }

    const fetchMonthlyWeather = async (month: string) => {
        isLoading.value = true
        try {
            const data = await $fetch<SeoulMonthlyWeather>(`/api/weather/${month}`)
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
            buildBoundaryOutlinePolylines()
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

        weatherOutlinePolylines.value.forEach(({ code, entity }) => {
            const outlineColor = toOpaqueColor(getLayerColor(snapshot, layer, code))
            if (!entity.polyline) return

            entity.polyline.material = Cesium.Color.fromCssColorString(outlineColor)
            entity.polyline.width = 2
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

        weatherOutlinePolylines.value.forEach(({ entity }) => v.entities.remove(entity))
        weatherOutlinePolylines.value = []
    }

    const init = async () => {
        await fetchBoundary()
        await fetchMonthlyWeather(selectedMonth.value)
        await loadBoundaryDataSource()
        updateCesiumPolygons()
    }

    watch(selectedDate, () => updateCesiumPolygons())
    watch(activeLayer, () => updateCesiumPolygons())
    watch(isVisible, (v) => {
        if (weatherDataSource) {
            ;(weatherDataSource as unknown as { show: boolean }).show = v
        }
        weatherOutlinePolylines.value.forEach(({ entity }) => {
            entity.show = v
        })
    })
    watch(selectedMonth, async (newMonth) => {
        await fetchMonthlyWeather(newMonth)
        updateCesiumPolygons()
    })

    return { init, clearWeatherLayer }
}
