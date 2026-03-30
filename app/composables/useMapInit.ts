import type { BaseNode, GeoJsonPolygon, PoiData } from '#shared/types/theme-map'

declare global {
  interface Window {
    Cesium: any
    MapPrime3DExtension: any
    MapPrime3D: any
    viewer: any
  }
}

export const useMapInit = () => {
  const highlightWrapEl = ref<HTMLElement | null>(null)
  const drawedPolygon = ref<any>(null)

  function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load: ${src}`))
      document.head.appendChild(script)
    })
  }

  async function init() {
    await loadScript('/lib/cesium/Cesium.js')
    await loadScript('/lib/js/mapprime.cesium-controls.min.js')

    window.viewer = new window.Cesium.Viewer('map', {
      baseLayerPicker: false,
      imageryProvider: false
    })

    window.viewer.extend(window.MapPrime3DExtension, {
      tileset: '/proxy/MapPrime3DManager/root/incheon/base/tileset/in_mesh3d/tileset.json',
      maximumScreenSpaceError: 0,
      controls: [],
      imageries: [
        {
          title: 'Imagery',
          credit: 'Arcgis',
          type: 'TMS',
          epsg: 'EPSG:3857',
          url: '/proxy/MapPrimeServer/map/wmts?layer=Outer_image_BASEMAP_AIREX_WM&tilematrixset=OSM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fwebp&TileMatrix={z}&TileCol={x}&TileRow={y}',
          format: 'jpeg',
          maximumLevel: 18,
          current: true
        }
      ],
      credit: '<i>MapPrime</i>',
      initialCamera: {
        longitude: 126.73598,
        latitude: 37.56909,
        height: 893.23,
        heading: 100,
        pitch: -60
      }
    })

    initClippingArea()
  }

  function initClippingArea() {
    window.viewer._createEntity('mask', {
      positions: window.MapPrime3D.PolyUtil.getBezierCurve(
        [
          [126.74444, 37.56408, 17.32],
          [126.74493, 37.56511, 25.34],
          [126.74447, 37.56619, 12.18],
          [126.74431, 37.56784, 17.24],
          [126.74461, 37.56902, 22.49],
          [126.74472, 37.57029, 10.11],
          [126.74457, 37.57123, 11.49],
          [126.74317, 37.57144, 11.7],
          [126.74216, 37.57147, 12.09],
          [126.74119, 37.57151, 12.16],
          [126.73952, 37.57152, 9.08],
          [126.73917, 37.57117, 11.64],
          [126.73917, 37.57117, 11.64],
          [126.7405, 37.56899, 10.93],
          [126.74158, 37.56745, 14.76],
          [126.74216, 37.56598, 16.45],
          [126.74227, 37.56414, 20.6],
          [126.7429, 37.56399, 20.47],
          [126.74391, 37.56393, 20.11]
        ],
        true
      ),
      fill: true,
      color: 'rgba(255, 255, 255)',
      opacity: 0.3,
      outline: true,
      outlineColor: 'rgb(255,100,70)',
      outlineWidth: 3,
      outlineOpacity: 1.0,
      arcType: window.Cesium.ArcType.GEODESIC,
      clampToGround: true
    })
  }

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

  function highLightPoi(poiId: string) {
    if (highlightWrapEl.value) {
      highlightWrapEl.value.classList.remove('highlight-poi')
      highlightWrapEl.value = null
    }
    const img = document.querySelector(`img[data-poiid="${poiId}"]`)
    const wrapEl = img?.closest('.icon-poi-wrap') as HTMLElement | null
    if (!wrapEl) return
    wrapEl.classList.add('highlight-poi')
    highlightWrapEl.value = wrapEl
  }

  function drawPolygon(geom: GeoJsonPolygon) {
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
    if (!geom || typeof geom === 'string') return
    const coords = (geom as GeoJsonPolygon).coordinates[0]
    const positions = coords.map(([lon, lat, alt]) =>
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

  return { init, drawPois, highLightPoi, drawPolygon, flyToNode }
}