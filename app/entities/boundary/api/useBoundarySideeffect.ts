import { centroid, polygon } from '@turf/turf'
import type { ShallowRef } from 'vue'
import type { Entity } from 'cesium'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import type { GeoFeature } from '#shared/types/geojson'
import { useBoundaryStore } from '~/entities/boundary/model/useBoundaryStore'
import { useDistrictStore } from '~/entities/boundary/model/useDistrictStore'
import { useDistrictSideeffect } from '~/entities/boundary/api/useDistrictSideeffect'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { createToggleLayerSideeffect } from '~/shared/lib/map/createToggleLayerSideeffect'

interface UseBoundarySideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

interface BoundaryLayerOptions {
    viewer: ShallowRef<CesiumViewer | null>
    geojson: { features?: GeoFeature[] } | null
    entities: Entity[]
    nameKey: string
    fillColor?: string
    lineColor: string
    lineAlpha: number
    lineWidth: number
    labelColor?: string
    labelAlpha?: number
    fontSize: string
    labelOutlineWidth: number
    showPolygon: boolean
}

const calcCentroid = (coords: number[][]): [number, number] => {
    const [lng, lat] = centroid(polygon([coords])).geometry.coordinates
    return [lng!, lat!]
}

const renderBoundaryLayer = (opts: BoundaryLayerOptions) => {
    const v = opts.viewer.value
    const C = getCesiumRuntime()
    if (!v || !C || !opts.geojson) return

    const lineCol = C.Color.fromCssColorString(opts.lineColor).withAlpha(opts.lineAlpha)
    const fillCol = opts.fillColor
        ? C.Color.fromCssColorString(opts.fillColor).withAlpha(0.08)
        : null
    const labelCol =
        opts.labelColor && opts.labelAlpha !== undefined
            ? C.Color.fromCssColorString(opts.labelColor).withAlpha(opts.labelAlpha)
            : lineCol

    for (const feature of opts.geojson.features ?? []) {
        const geo = feature.geometry
        if (!geo) continue
        const name = String(feature.properties?.[opts.nameKey] ?? '')

        const addRing = (ring: number[][], showLabel: boolean) => {
            const flat = ring.flatMap(([lng, lat]) => [lng!, lat!])
            const def: Record<string, unknown> = {
                polyline: {
                    positions: C.Cartesian3.fromDegreesArray(flat),
                    width: opts.lineWidth,
                    material: lineCol as unknown as undefined,
                    clampToGround: true
                }
            }
            if (opts.showPolygon && fillCol) {
                def.polygon = {
                    hierarchy: C.Cartesian3.fromDegreesArray(flat),
                    material: fillCol as unknown as undefined,
                    outline: false
                }
            }
            if (showLabel) {
                const [cLng, cLat] = calcCentroid(ring)
                def.position = C.Cartesian3.fromDegrees(cLng!, cLat!)
                def.label = {
                    text: name,
                    font: `${opts.fontSize} sans-serif`,
                    fillColor: labelCol,
                    outlineColor: C.Color.BLACK,
                    outlineWidth: opts.labelOutlineWidth,
                    style: C.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: C.VerticalOrigin.CENTER,
                    horizontalOrigin: C.HorizontalOrigin.CENTER,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            }
            opts.entities.push(v.entities.add(def as Parameters<typeof v.entities.add>[0]))
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

    const showGu = () =>
        renderBoundaryLayer({
            viewer,
            geojson: guGeojson.value as { features?: GeoFeature[] } | null,
            entities: guEntities,
            nameKey: 'SIG_KOR_NM',
            fillColor: '#2196F3',
            lineColor: '#2196F3',
            lineAlpha: 0.4,
            lineWidth: 2,
            fontSize: '13px',
            labelOutlineWidth: 2,
            showPolygon: true
        })

    const hideGu = () => {
        const v = viewer.value
        if (!v) return
        for (const e of guEntities) v.entities.remove(e)
        guEntities.length = 0
    }

    const showDong = () =>
        renderBoundaryLayer({
            viewer,
            geojson: dongGeojson.value as { features?: GeoFeature[] } | null,
            entities: dongEntities,
            nameKey: 'name',
            lineColor: '#2196F3',
            lineAlpha: 0.25,
            lineWidth: 1,
            labelColor: '#2196F3',
            labelAlpha: 0.5,
            fontSize: '11px',
            labelOutlineWidth: 1,
            showPolygon: false
        })

    const hideDong = () => {
        const v = viewer.value
        if (!v) return
        for (const e of dongEntities) v.entities.remove(e)
        dongEntities.length = 0
    }

    const guLayer = createToggleLayerSideeffect({
        source: isGuActive,
        apply: showGu,
        remove: hideGu
    })

    const dongLayer = createToggleLayerSideeffect({
        source: isDongActive,
        apply: showDong,
        remove: hideDong
    })

    const init = async () => {
        await Promise.all([ensureGuBoundaryLoaded(), ensureDongBoundaryLoaded()])
        guLayer.init()
        dongLayer.init()
    }

    return { init }
}
