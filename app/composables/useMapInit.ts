/**
 * MapPrime 3D 지도 뷰어를 초기화하는 sideeffect composable.
 * Cesium과 MapPrime 스크립트를 순서대로 동적 로드한 뒤 `window.viewer`를 생성한다.
 * SSR 비활성화(`ssr: false`) 페이지의 `onMounted`에서 `init()`을 호출해야 한다.
 */
export const useMapInit = () => {
    /**
     * `<script>` 태그를 동적으로 삽입하여 외부 스크립트를 로드한다.
     * 로드 완료 시 resolve, 오류 발생 시 reject되는 Promise를 반환한다.
     *
     * @param src - 로드할 스크립트의 URL 또는 경로
     */
    function loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = src
            script.onload = () => resolve()
            script.onerror = () => reject(new Error(`Failed to load: ${src}`))
            document.head.appendChild(script)
        })
    }

    /**
     * Cesium → MapPrime 순으로 스크립트를 로드하고 뷰어를 초기화한다.
     * 타일셋·이미지리·초기 카메라 위치는 이 함수 안에서 고정 설정된다.
     * 뷰어는 `window.viewer`에 할당되어 이후 composable에서 전역으로 접근한다.
     */
    async function init() {
        await loadScript('/lib/cesium/Cesium.js')
        await loadScript('/lib/js/mapprime.cesium-controls.min.js')

        window.viewer = new window.Cesium.Viewer('map', {
            baseLayerPicker: false,
            imageryProvider: false
        })

        window.viewer.extend(window.MapPrime3DExtension, {
            terrain: 'https://mapprime.synology.me:15289/seoul/data/terrain/1m_v1.1/',
            tileset: 'https://mapprime.synology.me:15289/seoul/data/all_ktx2/tileset.json',
            maximumScreenSpaceError: 0,
            controls: [],
            imageries: [
                {
                    title: 'Imagery',
                    credit: 'Arcgis',
                    type: 'TMS',
                    epsg: 'EPSG:3857',
                    url: 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    format: 'jpeg',
                    maximumLevel: 18,
                    current: true
                }
            ],
            credit: '<i>Runnable</i>',
            initialCamera: {
                longitude: 127.035,
                latitude: 37.519,
                height: 400,
                heading: 340,
                pitch: -50,
                roll: 0
            }
        })
    }

    return { init }
}
