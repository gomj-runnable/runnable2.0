import { booleanPointInPolygon, point, polygon } from '@turf/turf'
import type { ShallowRef, Ref } from 'vue'
import type { CesiumViewer } from '~/composables/useWindow'
import { useBoundaryStore } from '~/composables/store/useBoundaryStore'

interface UseCameraSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    centerLat: Ref<number | null>
    centerLng: Ref<number | null>
    altitude: Ref<number | null>
    heading: Ref<number | null>
    pitch: Ref<number | null>
    locationLabel: Ref<string>
}

/**
 * Cesium 카메라의 moveEnd 이벤트를 구독하고 카메라 정보를 갱신하는 sideeffect composable.
 * 화면 중심 좌표로 서울시 행정경계 역지오코딩을 수행해 locationLabel을 업데이트한다.
 *
 * @param options - 뷰어와 카메라 store ref를 포함한 의존성 옵션
 */
export const useCameraSideeffect = (options: UseCameraSideeffectOptions) => {
    const { viewer, centerLat, centerLng, altitude, heading, pitch, locationLabel } = options
    const { guGeojson, dongGeojson, ensureGuLoaded, ensureDongLoaded } = useBoundaryStore()

    const getCesium = () => window.Cesium

    /**
     * 점이 폴리곤 내부에 있는지 판단한다.
     * @param lng - 경도
     * @param lat - 위도
     * @param ring - 폴리곤 외곽 좌표 배열 ([lng, lat] 형식)
     */
    const pointInPolygon = (lng: number, lat: number, ring: number[][]): boolean =>
        booleanPointInPolygon(point([lng, lat]), polygon([ring]))

    /**
     * 위경도를 이용해 서울 행정구역 이름을 반환한다.
     * 동 경계가 로드되어 있으면 "서울특별시 {구} {동}" 형식, 아니면 "서울특별시 {구}" 형식.
     * 매칭 실패 시 빈 문자열을 반환한다.
     */
    const reverseGeocode = (lng: number, lat: number): string => {
        if (!guGeojson.value) return ''

        type GeoFeature = {
            properties?: Record<string, unknown>
            geometry?: {
                type: string
                coordinates: number[][][] | number[][][][]
            } | null
        }

        const geojson = guGeojson.value as { features?: GeoFeature[] }
        let guName = ''

        for (const feature of geojson.features ?? []) {
            const geo = feature.geometry
            if (!geo) continue

            const name = String(feature.properties?.SIG_KOR_NM ?? '')
            if (!name) continue

            if (geo.type === 'Polygon') {
                const rings = geo.coordinates as number[][][]
                if (rings[0] && pointInPolygon(lng, lat, rings[0])) {
                    guName = name
                    break
                }
            } else if (geo.type === 'MultiPolygon') {
                const polys = geo.coordinates as number[][][][]
                for (const poly of polys) {
                    if (poly[0] && pointInPolygon(lng, lat, poly[0])) {
                        guName = name
                        break
                    }
                }
                if (guName) break
            }
        }

        if (!guName) return '서울특별시'

        // 동 경계에서 동 이름 매칭
        if (dongGeojson.value) {
            const dongData = dongGeojson.value as { features?: GeoFeature[] }
            for (const feature of dongData.features ?? []) {
                const geo = feature.geometry
                if (!geo) continue

                const dongName = String(feature.properties?.name ?? '')
                if (!dongName) continue

                if (geo.type === 'Polygon') {
                    const rings = geo.coordinates as number[][][]
                    if (rings[0] && pointInPolygon(lng, lat, rings[0])) {
                        return `서울특별시 ${guName} ${dongName}`
                    }
                } else if (geo.type === 'MultiPolygon') {
                    const polys = geo.coordinates as number[][][][]
                    for (const poly of polys) {
                        if (poly[0] && pointInPolygon(lng, lat, poly[0])) {
                            return `서울특별시 ${guName} ${dongName}`
                        }
                    }
                }
            }
        }

        return `서울특별시 ${guName}`
    }

    /** moveEnd 이벤트 핸들러. 카메라 상태를 읽어 store를 갱신하고 역지오코딩을 수행한다. */
    const onMoveEnd = () => {
        const v = viewer.value
        if (!v) return

        const Cesium = getCesium()
        const camera = v.camera
        const scene = v.scene

        // 카메라 고도·방위각·기울기 갱신 (라디안 → 도)
        const positionCartographic = camera.positionCartographic
        altitude.value = positionCartographic.height

        const headingDeg = Cesium.Math.toDegrees(camera.heading)
        heading.value = ((headingDeg % 360) + 360) % 360

        const pitchDeg = Cesium.Math.toDegrees(camera.pitch)
        pitch.value = pitchDeg

        // 화면 중심 좌표를 지표면에 투영해 위경도 획득
        const windowPos = new Cesium.Cartesian2(
            Math.floor(scene.canvas.clientWidth / 2),
            Math.floor(scene.canvas.clientHeight / 2)
        )

        const ray = camera.getPickRay(windowPos)
        if (!ray) return

        const intersection = scene.globe.pick(ray, scene)
        if (!intersection) return

        const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(intersection)
        const lat = Cesium.Math.toDegrees(cartographic.latitude)
        const lng = Cesium.Math.toDegrees(cartographic.longitude)

        centerLat.value = lat
        centerLng.value = lng

        locationLabel.value = reverseGeocode(lng, lat)
    }

    /** removeEventListener 핸들러 참조 */
    let removeListener: (() => void) | null = null

    /**
     * 카메라 sideeffect를 초기화한다.
     * 행정경계를 로드하고 moveEnd 이벤트를 구독한다.
     */
    const init = async () => {
        await Promise.all([ensureGuLoaded(), ensureDongLoaded()])

        const v = viewer.value
        if (!v) return

        v.camera.moveEnd.addEventListener(onMoveEnd)
        removeListener = () => v.camera.moveEnd.removeEventListener(onMoveEnd)

        // 초기 상태를 즉시 한 번 갱신
        onMoveEnd()
    }

    /** 이벤트 구독을 해제한다. */
    const destroy = () => {
        removeListener?.()
        removeListener = null
    }

    return { init, destroy }
}
