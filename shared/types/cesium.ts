// Cesium 런타임 인터페이스 타입 정의 (CesiumRuntime, Viewer, Scene, DataSource 등)
import type {
    BoundingSphere,
    CallbackProperty,
    Cartesian2,
    Cartesian3,
    Cartographic,
    Color,
    EllipsoidGeodesic,
    HeadingPitchRange,
    Material,
    MaterialProperty
} from 'cesium'

/** Cesium ScreenSpaceEventHandler 래퍼 인터페이스 */
export interface CesiumDrawHandler {
    destroy(): void
    isDestroyed(): boolean
    setInputAction(
        action: (movement: { position?: unknown; endPosition?: unknown }) => void,
        type: unknown
    ): void
    getInputAction(type: unknown): unknown
    removeInputAction(type: unknown): void
}

/** Cesium 전역 네임스페이스 런타임 인터페이스 (window.Cesium 대응) */
export interface CesiumRuntime {
    Cartographic: {
        new (longitude?: number, latitude?: number, height?: number): Cartographic
        fromCartesian(position: Cartesian3): Cartographic
        fromDegrees(longitude: number, latitude: number, height?: number): Cartographic
    }
    Math: {
        toDegrees(radians: number): number
        toRadians(degrees: number): number
    }
    EllipsoidGeodesic: new (start: Cartographic, end: Cartographic) => EllipsoidGeodesic
    defined(value: unknown): boolean
    ScreenSpaceEventHandler: new (element?: unknown) => CesiumDrawHandler
    ScreenSpaceEventType: {
        LEFT_CLICK: unknown
        LEFT_DOWN: unknown
        LEFT_UP: unknown
        MOUSE_MOVE: unknown
        RIGHT_CLICK: unknown
    }
    CameraEventType: {
        LEFT_DRAG: unknown
        RIGHT_DRAG: unknown
        MIDDLE_DRAG: unknown
        WHEEL: unknown
        PINCH: unknown
    }
    CallbackProperty: new (callback: () => Cartesian3[], isConstant: boolean) => CallbackProperty
    Color: {
        new (red?: number, green?: number, blue?: number, alpha?: number): Color
        WHITE: Color
        BLACK: Color
        YELLOW: Color
        fromCssColorString(color: string): Color
    }
    HeightReference: {
        NONE: unknown
        CLAMP_TO_GROUND: unknown
    }
    LabelStyle: {
        FILL_AND_OUTLINE: unknown
    }
    VerticalOrigin: {
        BOTTOM: unknown
        CENTER: unknown
        TOP: unknown
    }
    sampleTerrainMostDetailed(
        terrainProvider: unknown,
        positions: Cartographic[]
    ): Promise<Cartographic[]>
    PolylineMaterialAppearance: new (options?: { material?: unknown }) => unknown
    ClassificationType: {
        TERRAIN: unknown
        CESIUM_3D_TILE: unknown
        BOTH: unknown
    }
    Cartesian2: new (x?: number, y?: number) => Cartesian2
    CesiumTerrainProvider: {
        fromUrl?: (url: string) => Promise<unknown>
        new (options?: { url?: string }): unknown
    }
    EllipsoidTerrainProvider: new () => unknown
    UrlTemplateImageryProvider: new (options: { url: string; maximumLevel?: number }) => unknown
    Cesium3DTileset: {
        fromUrl?: (url: string, options: { maximumScreenSpaceError: number }) => Promise<unknown>
        new (options: { url: string; maximumScreenSpaceError: number }): unknown
    }
    Cartesian3: {
        fromDegrees(longitude: number, latitude: number, height?: number): Cartesian3
        fromDegreesArray(coordinates: number[]): Cartesian3[]
        clone(cartesian: Cartesian3, result?: Cartesian3): Cartesian3
        distance(left: Cartesian3, right: Cartesian3): number
    }
    BoundingSphere: new (center: Cartesian3, radius?: number) => BoundingSphere
    HeadingPitchRange: new (heading?: number, pitch?: number, range?: number) => HeadingPitchRange
    HorizontalOrigin: {
        CENTER: unknown
        LEFT: unknown
        RIGHT: unknown
    }
    Ellipsoid: {
        WGS84: {
            cartesianToCartographic(cartesian: unknown): {
                latitude: number
                longitude: number
                height: number
            }
        }
    }
    createElevationBandMaterial?: (options: unknown) => Material
    Material: {
        fromType(type: string, options?: unknown): Material
    }
    PolylineDashMaterialProperty: new (options?: {
        color?: Color
        gapColor?: Color
        dashLength?: number
        dashPattern?: number
    }) => MaterialProperty
    GeoJsonDataSource: {
        load(
            data: object | string,
            options?: {
                stroke?: unknown
                fill?: unknown
                strokeWidth?: number
                clampToGround?: boolean
            }
        ): Promise<GeoJsonDataSourceInstance>
    }
    GroundPolylineGeometry: new (options: { positions: Cartesian3[]; width: number }) => unknown
    GeometryInstance: new (options: {
        id?: string
        geometry: unknown
        attributes?: Record<string, unknown>
    }) => unknown
    GroundPolylinePrimitive: new (options: {
        geometryInstances: unknown
        appearance: unknown
        asynchronous?: boolean
        show?: boolean
        classificationType?: unknown
    }) => GroundPolylinePrimitiveInstance
    PolylineColorAppearance: new () => unknown
    ColorGeometryInstanceAttribute: {
        fromColor(color: Color): unknown
        toValue(color: Color): unknown
    }
    ColorMaterialProperty: new (color: Color) => MaterialProperty
}

/** Cesium GeoJsonDataSource 로드 결과 인스턴스 */
export interface GeoJsonDataSourceInstance {
    entities: {
        values: GeoJsonEntityInstance[]
    }
}

/** GeoJsonDataSource 내 단일 엔티티 */
export interface GeoJsonEntityInstance {
    properties: Record<string, { getValue(): unknown }> | null | undefined
    polygon:
        | {
              material: unknown
              outlineColor: unknown
              outline: unknown
          }
        | null
        | undefined
}

/** Cesium GroundPolylinePrimitive 인스턴스 (show·색상 변경용) */
export interface GroundPolylinePrimitiveInstance {
    ready: boolean
    show: boolean
    getGeometryInstanceAttributes(id: string):
        | {
              color?: unknown
          }
        | undefined
}

/** Cesium Scene 런타임 인터페이스 (pick·globe·primitives) */
export interface CesiumSceneRuntime {
    pickPositionSupported?: boolean
    pickPosition(windowPosition: unknown): unknown
    pick(windowPosition: unknown): unknown
    globe?: {
        depthTestAgainstTerrain: boolean
        pick(ray: unknown, scene: CesiumSceneRuntime): unknown
        material?: unknown
    }
    primitives: {
        add(primitive: unknown): void
        remove(primitive: unknown): boolean
    }
}

/** Cesium Viewer 런타임 인터페이스 (camera·scene·dataSources) */
export interface CesiumViewerRuntime {
    canvas: unknown
    scene: CesiumSceneRuntime
    screenSpaceCameraController?: {
        rotateEventTypes?: unknown
        zoomEventTypes?: unknown
        enableRotate?: boolean
        enableTilt?: boolean
        enableZoom?: boolean
        enableTranslate?: boolean
        enableLook?: boolean
    }
    camera: {
        getPickRay(windowPosition: unknown): unknown
        setView(options: unknown): void
    }
    imageryLayers?: {
        removeAll(): void
        addImageryProvider(provider: unknown): void
    }
    terrainProvider?: unknown
    dataSources?: {
        add(dataSource: unknown): Promise<unknown>
        remove(dataSource: unknown): boolean
    }
}
