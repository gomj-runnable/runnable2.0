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
    ScreenSpaceEventHandler: new (...args: any[]) => CesiumDrawHandler
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
    CallbackProperty: new (...args: any[]) => CallbackProperty
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
    Cartesian2: new (...args: any[]) => unknown
    CesiumTerrainProvider: {
        fromUrl?: (url: string) => Promise<unknown>
        new (...args: any[]): unknown
    }
    EllipsoidTerrainProvider: new (...args: any[]) => unknown
    UrlTemplateImageryProvider: new (...args: any[]) => unknown
    Cesium3DTileset: {
        fromUrl?: (url: string, options: { maximumScreenSpaceError: number }) => Promise<unknown>
        new (...args: any[]): unknown
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
    GroundPolylineGeometry: new (...args: any[]) => unknown
    GeometryInstance: new (...args: any[]) => unknown
    GroundPolylinePrimitive: new (...args: any[]) => GroundPolylinePrimitiveInstance
    PolylineColorAppearance: new (...args: any[]) => unknown
    ColorGeometryInstanceAttribute: {
        fromColor(color: Color): unknown
        toValue(color: Color): unknown
    }
    ColorMaterialProperty: new (...args: any[]) => unknown
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
