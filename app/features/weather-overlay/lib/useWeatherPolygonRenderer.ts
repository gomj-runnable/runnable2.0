import type { Ref, ShallowRef } from 'vue'
import type {
    GeoJsonDataSourceInstance,
    GroundPolylinePrimitiveInstance
} from '#shared/types/cesium'
import type { HourlyWeather } from '#shared/types/weather'
import type { WeatherLayerEnum } from '#shared/types/weather-layer.enum'
import { toOpaqueColor } from '~/entities/weather/lib/useWeatherDataTransform'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'

type ActiveWeatherLayer = WeatherLayerEnum | null

interface UpdateCesiumPolygonsOptions {
    weatherDataSource: GeoJsonDataSourceInstance | null
    weatherOutlinePrimitive: GroundPolylinePrimitiveInstance | null
    weatherOutlineInstances: ShallowRef<Array<{ code: string; id: string }>>
    dailySnapshot: Ref<Map<string, HourlyWeather>>
    activeLayer: Ref<ActiveWeatherLayer>
    isVisible: Ref<boolean>
    getLayerColor: (
        snapshot: Map<string, HourlyWeather>,
        layer: ActiveWeatherLayer,
        code: string
    ) => string
}

export const updateCesiumPolygons = (options: UpdateCesiumPolygonsOptions) => {
    const {
        weatherDataSource,
        weatherOutlinePrimitive,
        weatherOutlineInstances,
        dailySnapshot,
        activeLayer,
        isVisible,
        getLayerColor
    } = options

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
