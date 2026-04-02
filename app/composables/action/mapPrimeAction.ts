import type { BaseNode, PoiData } from '#shared/types/theme-map'
import type { GeoJson } from '#shared/types/geojson.ts'
import type { MapPrimeEntity } from '~/composables/useWindow'

export const mapPrimeAction = () => {
    const drawedPolygon = ref<MapPrimeEntity | null>(null)

    function drawPois(datas: PoiData[]) {
        window.viewer._removeDivPOI('poi')
        window.viewer._createDivPOI({
            id: 'poi',
            maxFeatures: 9999,
            enableDistanceDisplay: false,
            data: datas,
            template: `
            <div class="icon-poi-wrap">
              <img alt="{name}" data-poiid="{poi_id}">
              <div class="poi-marker"><div class="poi-label">{name}</div></div>
            </div>
          `,
            horizontalOrigin: window.Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: window.Cesium.VerticalOrigin.TOP,
            addHeight: 1.0,
            pointerEvents: true
        })
    }

    function drawPolygon(geom: GeoJson) {
        window.viewer._removeGraphic(drawedPolygon.value)
        drawedPolygon.value = window.viewer._createEntity('polygon', {
            positions: geom.coordinates,
            color: '#3388ff',
            opacity: 0.5,
            clampToGround: true
        })
    }

    function flyToNode(node: BaseNode) {
        const geom = node?.attribute?.geom
        if (!geom) return
        const coords = (geom as GeoJsonPolygon).coordinates[0]
        const positions = coords?.map(([lon, lat, alt]: Position) =>
            window.Cesium.Cartesian3.fromDegrees(lon, lat, alt ?? 0)
        )
        const bs = window.Cesium.BoundingSphere.fromPoints(positions)
        const range = (bs.radius / Math.tan(window.viewer.camera.frustum.fov / 2)) * 3
        window.viewer.camera.flyToBoundingSphere(bs, {
            duration: 1.0,
            offset: new window.Cesium.HeadingPitchRange(
                window.viewer.camera.heading,
                window.viewer.camera.pitch,
                range
            )
        })
    }

    return { drawPois, drawPolygon, flyToNode }
}
