import type { ShallowRef, Ref, ComputedRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import type { CesiumRuntime, GroundPolylinePrimitiveInstance } from '#shared/types/cesium'
import type { GeoJsonMultiPolygon, GeoJsonPolygon, GeoJsonPosition } from '#shared/types/geojson'
import type { HourlyWeather } from '#shared/types/weather'
import type { WeatherLayerEnum } from '#shared/types/weather-layer.enum'
import { toCartesianPosition } from '~/entities/route/lib/useRouteDrawUtils'
import { toOpaqueColor } from '~/entities/weather/lib/useWeatherDataTransform'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'

type ActiveWeatherLayer = WeatherLayerEnum | null

export const getPolygonRings = (
    geometry: GeoJsonPolygon | GeoJsonMultiPolygon
): GeoJsonPosition[][] => {
    if (geometry.type === 'Polygon') {
        return geometry.coordinates as GeoJsonPosition[][]
    }

    return geometry.coordinates.flatMap((polygon) => polygon) as GeoJsonPosition[][]
}

interface BuildOutlinePrimitiveOptions {
    viewer: ShallowRef<CesiumViewer | null>
    boundaryGeojson: Ref<unknown>
    dailySnapshot: ComputedRef<Map<string, HourlyWeather>>
    activeLayer: Ref<ActiveWeatherLayer>
    isVisible: Ref<boolean>
    getLayerColor: (
        snapshot: Map<string, HourlyWeather>,
        layer: ActiveWeatherLayer,
        code: string
    ) => string
    weatherOutlinePrimitive: GroundPolylinePrimitiveInstance | null
    weatherOutlineInstances: ShallowRef<Array<{ code: string; id: string }>>
}

export const buildBoundaryOutlinePrimitive = (
    options: BuildOutlinePrimitiveOptions
): GroundPolylinePrimitiveInstance | null => {
    const {
        viewer,
        boundaryGeojson,
        dailySnapshot,
        activeLayer,
        isVisible,
        getLayerColor,
        weatherOutlinePrimitive,
        weatherOutlineInstances
    } = options

    const v = viewer.value
    if (!v || !boundaryGeojson.value) return null

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
        return null
    }

    const primitive = new Cesium.GroundPolylinePrimitive({
        geometryInstances,
        appearance: new Cesium.PolylineColorAppearance(),
        asynchronous: false,
        show: isVisible.value
    })
    v.scene.primitives.add(primitive)
    return primitive
}
