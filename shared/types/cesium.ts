import type { CallbackProperty, Cartesian3, Cartographic, Color, EllipsoidGeodesic } from 'cesium'

export interface CesiumDrawHandler {
    destroy(): void
    setInputAction(
        action: (movement: { position?: unknown; endPosition?: unknown }) => void,
        type: unknown
    ): void
}

export interface CesiumRuntime {
    Cartographic: {
        fromCartesian(position: Cartesian3): Cartographic
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
        WHITE: Color
        BLACK: Color
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
    }
    Cartesian2: new (x?: number, y?: number) => unknown
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
    }
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
    }) => GroundPolylinePrimitiveInstance
    PolylineColorAppearance: new () => unknown
    ColorGeometryInstanceAttribute: {
        fromColor(color: Color): unknown
        toValue(color: Color): unknown
    }
    ColorMaterialProperty: new (color: Color) => unknown
}

export interface GeoJsonDataSourceInstance {
    entities: {
        values: GeoJsonEntityInstance[]
    }
}

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

export interface GroundPolylinePrimitiveInstance {
    ready: boolean
    show: boolean
    getGeometryInstanceAttributes(id: string):
        | {
              color?: unknown
          }
        | undefined
}

export interface CesiumSceneRuntime {
    pickPositionSupported?: boolean
    pickPosition(windowPosition: unknown): unknown
    pick(windowPosition: unknown): unknown
    globe?: {
        depthTestAgainstTerrain: boolean
        pick(ray: unknown, scene: CesiumSceneRuntime): unknown
    }
    primitives: {
        add(primitive: unknown): void
        remove(primitive: unknown): boolean
    }
}

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
