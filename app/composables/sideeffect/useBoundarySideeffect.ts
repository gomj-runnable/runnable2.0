import { centroid, polygon } from '@turf/turf'
import type { ShallowRef } from 'vue'
import type { Entity } from 'cesium'
import type { CesiumViewer } from '~/composables/useWindow'
import type { GeoFeature } from '#shared/types/geojson'
import { useBoundaryStore } from '~/composables/store/useBoundaryStore'
import { useDistrictStore } from '~/composables/store/useDistrictStore'
import { useDistrictSideeffect } from '~/composables/sideeffect/useDistrictSideeffect'

interface UseBoundarySideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

/**
 * 서울시 행정경계 GeoJSON을 불러와 Cesium 지도에 Polygon/Polyline/Label 엔티티로 렌더링하는 sideeffect composable.
 * 시군구와 읍면동 레이어를 독립적으로 on/off한다. 읍면동이 시군구 위에 렌더링된다.
 */
export const useBoundarySideeffect = (options: UseBoundarySideeffectOptions) => {
    const { viewer } = options
    const { isGuActive, isDongActive } = useBoundaryStore()
    const { guGeojson, dongGeojson } = useDistrictStore()
    const { ensureGuBoundaryLoaded, ensureDongBoundaryLoaded } = useDistrictSideeffect()

    /** 시군구 Entity 목록 */
    const guEntities: Entity[] = []
    /** 행정동 Entity 목록 */
    const dongEntities: Entity[] = []

    const calcCentroid = (coords: number[][]): [number, number] => {
        const [lng, lat] = centroid(polygon([coords])).geometry.coordinates
        return [lng!, lat!]
    }

    /** 시군구 엔티티를 추가한다. */
    const showGu = () => {
        const v = viewer.value
        const C = window.Cesium
        if (!v || !C || !guGeojson.value) return

        const geojson = guGeojson.value as { features?: GeoFeature[] }
        const fillColor = C.Color.fromCssColorString('#2196F3').withAlpha(0.08)
        const lineColor = C.Color.fromCssColorString('#2196F3').withAlpha(0.4)

        for (const feature of geojson.features ?? []) {
            const geo = feature.geometry
            if (!geo) continue
            const name = String(feature.properties?.SIG_KOR_NM ?? '')

            const addRing = (ring: number[][], showLabel: boolean) => {
                const flat = ring.flatMap(([lng, lat]) => [lng!, lat!])
                const def: Record<string, unknown> = {
                    polygon: {
                        hierarchy: C.Cartesian3.fromDegreesArray(flat),
                        material: fillColor as unknown as undefined,
                        outline: false
                    },
                    polyline: {
                        positions: C.Cartesian3.fromDegreesArray(flat),
                        width: 2,
                        material: lineColor as unknown as undefined,
                        clampToGround: true
                    }
                }
                if (showLabel) {
                    const [cLng, cLat] = calcCentroid(ring)
                    def.position = C.Cartesian3.fromDegrees(cLng!, cLat!)
                    def.label = {
                        text: name,
                        font: '13px sans-serif',
                        fillColor: lineColor,
                        outlineColor: C.Color.BLACK,
                        outlineWidth: 2,
                        style: C.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: C.VerticalOrigin.CENTER,
                        horizontalOrigin: C.HorizontalOrigin.CENTER,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    }
                }
                guEntities.push(v.entities.add(def as Parameters<typeof v.entities.add>[0]))
            }

            if (geo.type === 'Polygon') {
                const rings = geo.coordinates as number[][][]
                if (rings[0]) addRing(rings[0], true)
            } else if (geo.type === 'MultiPolygon') {
                const polys = geo.coordinates as number[][][][]
                polys.forEach((poly, idx) => {
                    if (poly[0]) addRing(poly[0], idx === 0)
                })
            }
        }
    }

    const hideGu = () => {
        const v = viewer.value
        if (!v) return
        for (const e of guEntities) v.entities.remove(e)
        guEntities.length = 0
    }

    /** 행정동 엔티티를 추가한다. 시군구 위에 렌더링된다. */
    const showDong = () => {
        const v = viewer.value
        const C = window.Cesium
        if (!v || !C || !dongGeojson.value) return

        const geojson = dongGeojson.value as { features?: GeoFeature[] }
        const lineColor = C.Color.fromCssColorString('#2196F3').withAlpha(0.25)
        const labelColor = C.Color.fromCssColorString('#2196F3').withAlpha(0.5)

        for (const feature of geojson.features ?? []) {
            const geo = feature.geometry
            if (!geo) continue
            const name = String(feature.properties?.name ?? '')

            const addRing = (ring: number[][], showLabel: boolean) => {
                const flat = ring.flatMap(([lng, lat]) => [lng!, lat!])
                const def: Record<string, unknown> = {
                    polyline: {
                        positions: C.Cartesian3.fromDegreesArray(flat),
                        width: 1,
                        material: lineColor as unknown as undefined,
                        clampToGround: true
                    }
                }
                if (showLabel) {
                    const [cLng, cLat] = calcCentroid(ring)
                    def.position = C.Cartesian3.fromDegrees(cLng!, cLat!)
                    def.label = {
                        text: name,
                        font: '11px sans-serif',
                        fillColor: labelColor,
                        outlineColor: C.Color.BLACK,
                        outlineWidth: 1,
                        style: C.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: C.VerticalOrigin.CENTER,
                        horizontalOrigin: C.HorizontalOrigin.CENTER,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    }
                }
                dongEntities.push(v.entities.add(def as Parameters<typeof v.entities.add>[0]))
            }

            if (geo.type === 'Polygon') {
                const rings = geo.coordinates as number[][][]
                if (rings[0]) addRing(rings[0], true)
            } else if (geo.type === 'MultiPolygon') {
                const polys = geo.coordinates as number[][][][]
                polys.forEach((poly, idx) => {
                    if (poly[0]) addRing(poly[0], idx === 0)
                })
            }
        }
    }

    const hideDong = () => {
        const v = viewer.value
        if (!v) return
        for (const e of dongEntities) v.entities.remove(e)
        dongEntities.length = 0
    }

    const init = async () => {
        await Promise.all([ensureGuBoundaryLoaded(), ensureDongBoundaryLoaded()])

        const stopGuWatch = watch(
            isGuActive,
            (active) => {
                if (active) showGu()
                else hideGu()
            },
            { immediate: true }
        )

        const stopDongWatch = watch(
            isDongActive,
            (active) => {
                if (active) showDong()
                else hideDong()
            },
            { immediate: true }
        )

        onBeforeUnmount(() => {
            stopGuWatch()
            stopDongWatch()
        })
    }

    return { init }
}
