export const useMapInit = () => {
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
                    url: '/proxy/MapPrimeServer/map/wmts?layer=Outer_image_BASEMAP_AIREX_WM&tilematrixset=OSM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=images%2Fwebp&TileMatrix={z}&TileCol={x}&TileRow={y}',
                    format: 'jpeg',
                    maximumLevel: 18,
                    current: true
                }
            ],
            credit: '<i>Runnable</i>',
            initialCamera: {
                longitude: 126.73598,
                latitude: 37.56909,
                height: 893.23,
                heading: 100,
                pitch: -60
            }
        })
    }

    return { init }
}
