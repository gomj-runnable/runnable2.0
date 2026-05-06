import type { Cartesian3 } from 'cesium'
import type { CommonResponse } from '#shared/types/common'
import type { CesiumDrawHandler, CesiumRuntime, CesiumViewerRuntime } from '#shared/types/cesium'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { DrawActionData, DrawActionResult, CesiumViewer } from '~/shared/lib/useWindow'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'

/**
 * 클릭 위치가 건물(3DTileset) 위인지 판별하고, 그렇다면 인근 비건물 지면 좌표를 찾는 헬퍼 인터페이스.
 * shared 레이어가 features/camera에 직접 의존하지 않도록 DI로 주입한다.
 */
export interface BuildingPickHelpers {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    isBuildingPick: (pickResult: any) => boolean
    findNearestGroundPosition: (
        viewer: any,
        CesiumLib: any,
        windowPosition: any,
        searchRadius?: number
    ) => { snappedPosition: any; corrected: boolean }
    /* eslint-enable @typescript-eslint/no-explicit-any */
}

type ViewerEntityHandle = Parameters<CesiumViewer['entities']['remove']>[0]

interface CesiumDrawState {
    handler: CesiumDrawHandler
    previewLine: { entity: ViewerEntityHandle } | null
    previewPoints: Array<{ entity: ViewerEntityHandle }>
    positions: Cartesian3[]
    floatingPosition: Cartesian3 | null
    resolve: (result: DrawActionResult) => void
    _cleanupTouch?: () => void
}

interface MapInitOptions {
    onBuildingCorrected?: () => void
    /** 건물 위 클릭을 지면으로 보정하는 헬퍼. 미주입 시 보정을 건너뛴다. */
    buildingPickHelpers?: BuildingPickHelpers
}

/**
 * Cesium 3D 지도 뷰어를 초기화하는 sideeffect composable.
 * Cesium 스크립트를 동적 로드한 뒤 viewer를 만들고, 앱에서 쓰는 드로잉 helper를 부착한다.
 * SSR 비활성화(`ssr: false`) 페이지의 `onMounted`에서 `init()`을 호출해야 한다.
 */
export const useMapInit = (options?: MapInitOptions) => {
    /** 현재 진행 중인 드로잉 세션 상태. 드로잉이 없으면 `null`. */
    let activeDrawState: CesiumDrawState | null = null
    let lastPickWasCorrected = false

    const getHiddenCreditContainer = () => {
        const existing = document.getElementById('cesium-credit-hidden')

        if (existing) {
            return existing
        }

        const container = document.createElement('div')
        container.id = 'cesium-credit-hidden'
        container.style.display = 'none'
        document.body.appendChild(container)

        return container
    }

    /**
     * `<script>` 태그를 동적으로 삽입하여 외부 스크립트를 로드한다.
     * 로드 완료 시 resolve, 오류 발생 시 reject되는 Promise를 반환한다.
     *
     * @param src - 로드할 스크립트의 URL 또는 경로
     */
    function loadScript(src: string): Promise<void> {
        const existingScript = document.querySelector(`script[src="${src}"]`)

        if (existingScript) {
            return new Promise((resolve, reject) => {
                if ((existingScript as HTMLScriptElement).dataset.loaded === 'true') {
                    resolve()
                    return
                }

                existingScript.addEventListener('load', () => resolve(), { once: true })
                existingScript.addEventListener(
                    'error',
                    () => reject(new Error(`Failed to load: ${src}`)),
                    { once: true }
                )
            })
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = src
            script.onload = () => {
                script.dataset.loaded = 'true'
                resolve()
            }
            script.onerror = () => reject(new Error(`Failed to load: ${src}`))
            document.head.appendChild(script)
        })
    }

    const toGeoJsonPosition = (cartesian: Cartesian3): GeoJsonPosition => {
        const CesiumLib = getCesiumRuntime()
        const cartographic = CesiumLib.Cartographic.fromCartesian(cartesian)

        return [
            CesiumLib.Math.toDegrees(cartographic.longitude),
            CesiumLib.Math.toDegrees(cartographic.latitude),
            cartographic.height
        ]
    }

    const calculateDistance = (positions: Cartesian3[]): number => {
        const CesiumLib = getCesiumRuntime()

        if (positions.length < 2) {
            return 0
        }

        return positions.slice(1).reduce((total, position, index) => {
            const start = CesiumLib.Cartographic.fromCartesian(positions[index]!)
            const end = CesiumLib.Cartographic.fromCartesian(position)
            const geodesic = new CesiumLib.EllipsoidGeodesic(start, end)
            const surfaceDistance = geodesic.surfaceDistance ?? 0
            const heightDelta = (end.height ?? 0) - (start.height ?? 0)

            return total + Math.hypot(surfaceDistance, heightDelta)
        }, 0)
    }

    const createDrawActionData = (positions: Cartesian3[]): CommonResponse<DrawActionData> => {
        const wgs84Array = positions.map(toGeoJsonPosition)
        const heights = wgs84Array.map(([, , height = 0]) => height)

        return {
            state: 'success',
            data: {
                distance: calculateDistance(positions),
                heights,
                positions,
                wgs84Array,
                GeoJSON: {
                    type: 'LineString',
                    coordinates: wgs84Array
                },
                unit: 'm',
                averageElevation:
                    heights.length > 0
                        ? String(heights.reduce((sum, height) => sum + height, 0) / heights.length)
                        : undefined
            }
        }
    }

    const removeDrawPreview = (viewer: CesiumViewer, drawState: CesiumDrawState | null) => {
        if (!drawState) {
            return
        }

        if (drawState.previewLine?.entity) {
            viewer.entities.remove(drawState.previewLine.entity)
        }

        drawState.previewPoints.forEach((point) => {
            viewer.entities.remove(point.entity)
        })
    }

    const destroyDrawState = (viewer: CesiumViewer, drawState: CesiumDrawState | null) => {
        if (!drawState) {
            return
        }

        drawState._cleanupTouch?.()
        drawState.handler.destroy()
        removeDrawPreview(viewer, drawState)
    }

    const pickCartesian = (
        viewer: CesiumViewer,
        movement: { position?: unknown; endPosition?: unknown }
    ) => {
        const CesiumLib = getCesiumRuntime()
        const rawViewer = viewer as unknown as CesiumViewerRuntime
        const scene = rawViewer.scene
        const windowPosition = movement.endPosition ?? movement.position

        if (!scene || !windowPosition) {
            return null
        }

        // 건물(3DTileset) 감지 — buildingPickHelpers가 주입되었을 때만 동작
        const helpers = options?.buildingPickHelpers
        if (helpers) {
            const pickResult = scene.pick(windowPosition)
            if (helpers.isBuildingPick(pickResult)) {
                const { snappedPosition, corrected } = helpers.findNearestGroundPosition(
                    rawViewer,
                    CesiumLib,
                    windowPosition
                )
                lastPickWasCorrected = corrected
                if (snappedPosition) return snappedPosition as Cartesian3
            }
        }

        lastPickWasCorrected = false

        if (scene.pickPositionSupported) {
            const picked = scene.pickPosition(windowPosition)

            if (CesiumLib.defined(picked)) {
                return picked as Cartesian3
            }
        }

        const ray = rawViewer.camera?.getPickRay?.(windowPosition)

        if (!ray) {
            return null
        }

        const picked = scene.globe?.pick?.(ray, scene)

        return CesiumLib.defined(picked) ? (picked as Cartesian3) : null
    }

    const attachDrawHelpers = (viewer: CesiumViewer) => {
        const CesiumLib = getCesiumRuntime()
        const rawViewer = viewer as unknown as CesiumViewerRuntime

        viewer._cancelDrawAction = () => {
            if (!activeDrawState) {
                return
            }

            const current = activeDrawState
            activeDrawState = null
            destroyDrawState(viewer, current)
            current.resolve(null)
        }

        viewer._finishDrawAction = () => {
            const current = activeDrawState

            if (!current) {
                return
            }

            activeDrawState = null
            destroyDrawState(viewer, current)

            current.resolve(
                current.positions.length >= 2 ? createDrawActionData(current.positions) : null
            )
        }

        viewer._drawAction = (drawOptions) =>
            new Promise((resolve) => {
                if (drawOptions.shapeType !== 1) {
                    resolve({
                        state: 'fail',
                        message: '현재는 폴리라인 드로잉만 지원합니다.'
                    })
                    return
                }

                viewer._cancelDrawAction()

                const handler = new CesiumLib.ScreenSpaceEventHandler(rawViewer.canvas)
                const drawState: CesiumDrawState = {
                    handler,
                    previewLine: null,
                    previewPoints: [],
                    positions: [],
                    floatingPosition: null,
                    resolve
                }

                activeDrawState = drawState

                drawState.previewLine = {
                    entity: viewer.entities.add({
                        polyline: {
                            positions: new CesiumLib.CallbackProperty(() => {
                                if (drawState.positions.length === 0) {
                                    return []
                                }

                                return drawState.floatingPosition
                                    ? [...drawState.positions, drawState.floatingPosition]
                                    : drawState.positions
                            }, false),
                            width: 4,
                            clampToGround: true,
                            material: CesiumLib.Color.WHITE.withAlpha(0.9)
                        }
                    })
                }

                handler.setInputAction((movement: { position?: unknown }) => {
                    const picked = pickCartesian(viewer, movement)

                    if (!picked) {
                        return
                    }

                    drawState.positions.push(picked)
                    drawState.previewPoints.push({
                        entity: viewer.entities.add({
                            position: picked,
                            point: {
                                pixelSize: 8,
                                color: CesiumLib.Color.WHITE,
                                disableDepthTestDistance: Number.POSITIVE_INFINITY
                            }
                        })
                    })

                    if (lastPickWasCorrected) {
                        options?.onBuildingCorrected?.()
                    }
                }, CesiumLib.ScreenSpaceEventType.LEFT_CLICK)

                handler.setInputAction((movement: { endPosition?: unknown }) => {
                    if (drawState.positions.length === 0) {
                        return
                    }

                    drawState.floatingPosition = pickCartesian(viewer, movement)
                }, CesiumLib.ScreenSpaceEventType.MOUSE_MOVE)

                handler.setInputAction(() => {
                    const current = activeDrawState

                    if (!current) {
                        return
                    }

                    activeDrawState = null
                    destroyDrawState(viewer, current)

                    resolve(
                        current.positions.length >= 2
                            ? createDrawActionData(current.positions)
                            : null
                    )
                }, CesiumLib.ScreenSpaceEventType.RIGHT_CLICK)

                // 모바일 롱프레스로 드로잉 완료 (500ms 이상 터치)
                const LONG_PRESS_MS = 500
                const MOVE_THRESHOLD = 10
                let longPressTimer: ReturnType<typeof setTimeout> | null = null
                let touchStartPos: { x: number; y: number } | null = null

                const clearLongPress = () => {
                    if (longPressTimer) {
                        clearTimeout(longPressTimer)
                        longPressTimer = null
                    }
                    touchStartPos = null
                }

                const onTouchStart = (e: TouchEvent) => {
                    if (e.touches.length !== 1 || drawState.positions.length < 2) return
                    touchStartPos = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY }
                    longPressTimer = setTimeout(() => {
                        viewer._finishDrawAction()
                    }, LONG_PRESS_MS)
                }

                const onTouchMove = (e: TouchEvent) => {
                    if (!touchStartPos || !longPressTimer) return
                    const dx = e.touches[0]!.clientX - touchStartPos.x
                    const dy = e.touches[0]!.clientY - touchStartPos.y
                    if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) {
                        clearLongPress()
                    }
                }

                const onTouchEnd = () => clearLongPress()

                const canvas = rawViewer.canvas as HTMLCanvasElement
                canvas.addEventListener('touchstart', onTouchStart, { passive: true })
                canvas.addEventListener('touchmove', onTouchMove, { passive: true })
                canvas.addEventListener('touchend', onTouchEnd)
                canvas.addEventListener('touchcancel', onTouchEnd)

                // 기존 destroyDrawState 호출 시 터치 리스너도 정리되도록 참조 저장
                drawState._cleanupTouch = () => {
                    clearLongPress()
                    canvas.removeEventListener('touchstart', onTouchStart)
                    canvas.removeEventListener('touchmove', onTouchMove)
                    canvas.removeEventListener('touchend', onTouchEnd)
                    canvas.removeEventListener('touchcancel', onTouchEnd)
                }
            })
    }

    const applyViewerScene = async (viewer: CesiumViewer) => {
        const CesiumLib = getCesiumRuntime()
        const rawViewer = viewer as unknown as CesiumViewerRuntime
        const terrainUrl = 'https://mapprime.synology.me:15289/seoul/data/terrain/1m_v1.1/'
        const tilesetUrl = 'https://mapprime.synology.me:15289/seoul/data/all_ktx2/tileset.json'

        if (rawViewer.screenSpaceCameraController) {
            rawViewer.screenSpaceCameraController.rotateEventTypes = [
                CesiumLib.CameraEventType.LEFT_DRAG,
                CesiumLib.CameraEventType.RIGHT_DRAG
            ]
            rawViewer.screenSpaceCameraController.zoomEventTypes = [
                CesiumLib.CameraEventType.WHEEL,
                CesiumLib.CameraEventType.PINCH,
                CesiumLib.CameraEventType.MIDDLE_DRAG
            ]
        }

        if (rawViewer.scene.globe) {
            rawViewer.scene.globe.depthTestAgainstTerrain = true
        }

        if (rawViewer.imageryLayers?.removeAll) {
            rawViewer.imageryLayers.removeAll()
        }

        rawViewer.imageryLayers?.addImageryProvider?.(
            new CesiumLib.UrlTemplateImageryProvider({
                url: 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                maximumLevel: 18
            })
        )

        try {
            rawViewer.terrainProvider = CesiumLib.CesiumTerrainProvider.fromUrl
                ? await CesiumLib.CesiumTerrainProvider.fromUrl(terrainUrl)
                : new CesiumLib.CesiumTerrainProvider({ url: terrainUrl })
        } catch (error) {
            rawViewer.terrainProvider = new CesiumLib.EllipsoidTerrainProvider()
            console.warn('Cesium terrain load failed. Falling back to ellipsoid terrain.', error)
        }

        const tileset = CesiumLib.Cesium3DTileset.fromUrl
            ? await CesiumLib.Cesium3DTileset.fromUrl(tilesetUrl, {
                  maximumScreenSpaceError: 0
              })
            : new CesiumLib.Cesium3DTileset({
                  url: tilesetUrl,
                  maximumScreenSpaceError: 0
              })

        rawViewer.scene.primitives.add(tileset)

        rawViewer.camera.setView({
            destination: CesiumLib.Cartesian3.fromDegrees(127.035, 37.519, 400),
            orientation: {
                heading: CesiumLib.Math.toRadians(340),
                pitch: CesiumLib.Math.toRadians(-50),
                roll: 0
            }
        })
    }

    /**
     * Cesium 스크립트를 로드하고 viewer를 초기화한다.
     * 타일셋·이미지리·초기 카메라 위치와 드로잉 helper를 이 함수 안에서 설정한다.
     * 뷰어는 `window.viewer`에 할당되어 이후 composable에서 전역으로 접근한다.
     */
    async function init() {
        ;(window as Window & { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = '/lib/cesium'
        await loadScript('/lib/cesium/Cesium.js')
        const creditContainer = getHiddenCreditContainer()

        const CesiumLib = getCesiumRuntime()
        const viewer = new (
            CesiumLib as unknown as {
                Viewer: new (container: string, options: object) => CesiumViewer
            }
        ).Viewer('map', {
            baseLayerPicker: false,
            baseLayer: false,
            animation: false,
            timeline: false,
            geocoder: false,
            homeButton: false,
            fullscreenButton: false,
            infoBox: false,
            navigationHelpButton: false,
            creditContainer,
            sceneModePicker: false,
            selectionIndicator: false
        }) as CesiumViewer

        window.viewer = viewer

        attachDrawHelpers(viewer)
        await applyViewerScene(viewer)
    }

    return { init }
}
