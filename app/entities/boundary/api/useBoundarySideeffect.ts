import type { ShallowRef } from 'vue'
import type { Entity } from 'cesium'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import type { BoundaryFeature, BoundaryLevel } from '~/entities/boundary/lib/boundaryGeojson'
import { loadBoundaryGeojson } from '~/entities/boundary/lib/boundaryGeojson'
import { useBoundaryStore } from '~/entities/boundary/model/useBoundaryStore'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { createToggleLayerSideeffect } from '~/shared/lib/map/createToggleLayerSideeffect'
import { MapLayerZIndexEnum } from '#shared/types/map-layer-z-index.enum'

interface UseBoundarySideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

interface BoundaryLayerStyle {
    level: BoundaryLevel
    lineColor: string
    lineAlpha: number
    lineWidth: number
    labelAlpha: number
    fontSize: string
    labelOutlineWidth: number
    zIndex: number
}

/** 시군구: 진한 라인(width 2) + 라벨 13px, zIndex -2 (가장 아래) */
const GU_STYLE: BoundaryLayerStyle = {
    level: 'sgg',
    lineColor: '#2196F3',
    lineAlpha: 0.4,
    lineWidth: 2,
    labelAlpha: 1,
    fontSize: '13px',
    labelOutlineWidth: 2,
    zIndex: MapLayerZIndexEnum.SGG_BOUNDARY.zIndex
}

/** 읍면동: 옅은 라인(width 1) + 라벨 11px, zIndex -1 (시군구 위, 횡단보도 아래) */
const DONG_STYLE: BoundaryLayerStyle = {
    level: 'emd',
    lineColor: '#2196F3',
    lineAlpha: 0.25,
    lineWidth: 1,
    labelAlpha: 0.5,
    fontSize: '11px',
    labelOutlineWidth: 1,
    zIndex: MapLayerZIndexEnum.EMD_BOUNDARY.zIndex
}

/**
 * 단일 ring([lng,lat][]) 을 clampToGround polyline Entity 로 추가한다.
 * zIndex 로 지면 레이어 간 그려지는 순서를 고정한다.
 */
const addRing = (
    v: CesiumViewer,
    C: NonNullable<ReturnType<typeof getCesiumRuntime>>,
    entities: Entity[],
    ring: number[][],
    lineCol: unknown,
    style: BoundaryLayerStyle
) => {
    const flat = ring.flatMap(([lng, lat]) => [lng!, lat!])
    const def = {
        polyline: {
            positions: C.Cartesian3.fromDegreesArray(flat),
            width: style.lineWidth,
            material: lineCol as undefined,
            clampToGround: true,
            zIndex: style.zIndex
        }
    }
    entities.push(v.entities.add(def as Parameters<typeof v.entities.add>[0]))
}

/**
 * feature 1개당 라벨 Entity 1개를 _labelPoint([lng,lat]) 위치에 추가한다.
 * _labelPoint 가 없으면 라벨을 생략한다.
 */
const addLabel = (
    v: CesiumViewer,
    C: NonNullable<ReturnType<typeof getCesiumRuntime>>,
    entities: Entity[],
    feature: BoundaryFeature,
    labelCol: unknown,
    style: BoundaryLayerStyle
) => {
    const point = feature.properties._labelPoint
    if (!point) return
    const [lng, lat] = point
    const def = {
        position: C.Cartesian3.fromDegrees(lng, lat),
        label: {
            text: feature.properties.NAME,
            font: `${style.fontSize} sans-serif`,
            fillColor: labelCol,
            outlineColor: C.Color.BLACK,
            outlineWidth: style.labelOutlineWidth,
            style: C.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: C.VerticalOrigin.CENTER,
            horizontalOrigin: C.HorizontalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
    }
    entities.push(v.entities.add(def as Parameters<typeof v.entities.add>[0]))
}

/** Polygon/MultiPolygon 의 모든 ring 을 각각 polyline 으로 그린다. */
const renderFeature = (
    v: CesiumViewer,
    C: NonNullable<ReturnType<typeof getCesiumRuntime>>,
    entities: Entity[],
    feature: BoundaryFeature,
    lineCol: unknown,
    style: BoundaryLayerStyle
) => {
    const geo = feature.geometry
    if (!geo) return

    if (geo.type === 'Polygon') {
        const rings = geo.coordinates as number[][][]
        for (const ring of rings) addRing(v, C, entities, ring, lineCol, style)
    } else if (geo.type === 'MultiPolygon') {
        const polys = geo.coordinates as number[][][][]
        for (const poly of polys) {
            for (const ring of poly) addRing(v, C, entities, ring, lineCol, style)
        }
    }
}

/**
 * 서울시 행정경계 GeoJSON 을 싱글턴 로더로 불러와 Cesium 지도에 Polyline/Label
 * 엔티티로 렌더링하는 sideeffect composable.
 * 시군구(zIndex -2)와 읍면동(zIndex -1)을 독립 토글하며, 읍면동이 시군구 위에 그려진다.
 * 둘 다 횡단보도(zIndex 0) 아래에 위치한다.
 */
export const useBoundarySideeffect = (options: UseBoundarySideeffectOptions) => {
    const { viewer } = options
    const { isGuActive, isDongActive } = useBoundaryStore()

    /**
     * 토글 ON 시점에 geojson 을 lazy 로드하고 렌더하는 레이어를 만든다.
     * 비동기 레이스 가드: generation 카운터로 await 중에 hide 가 끼어들면 중단한다.
     */
    const createLayer = (style: BoundaryLayerStyle) => {
        const entities: Entity[] = []
        let generation = 0

        const show = async () => {
            const myGen = generation
            const geojson = await loadBoundaryGeojson(style.level)
            // await 사이에 hide() 가 호출됐다면 generation 이 증가했으므로 중단
            if (myGen !== generation) return

            const v = viewer.value
            const C = getCesiumRuntime()
            if (!v || !C) return

            const lineCol = C.Color.fromCssColorString(style.lineColor).withAlpha(style.lineAlpha)
            const labelCol = C.Color.fromCssColorString(style.lineColor).withAlpha(style.labelAlpha)

            for (const feature of geojson.features) {
                renderFeature(v, C, entities, feature, lineCol, style)
                addLabel(v, C, entities, feature, labelCol, style)
            }
        }

        const hide = () => {
            generation += 1
            const v = viewer.value
            if (!v) return
            for (const e of entities) v.entities.remove(e)
            entities.length = 0
        }

        return createToggleLayerSideeffect({
            source: style.level === 'sgg' ? isGuActive : isDongActive,
            apply: () => void show(),
            remove: hide
        })
    }

    const guLayer = createLayer(GU_STYLE)
    const dongLayer = createLayer(DONG_STYLE)

    const init = () => {
        guLayer.init()
        dongLayer.init()
    }

    return { init }
}
