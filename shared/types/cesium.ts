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
    ScreenSpaceEventHandler: new (canvas: unknown) => CesiumDrawHandler
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
        fromCssColorString(color: string): Color
    }
    CesiumTerrainProvider: {
        fromUrl?: (url: string) => Promise<unknown>
        new (options: { url: string }): unknown
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
    ColorMaterialProperty: new (color: unknown) => unknown
}

export interface GeoJsonDataSourceInstance {
    entities: {
        values: GeoJsonEntityInstance[]
    }
}

export interface GeoJsonEntityInstance {
    properties: Record<string, { getValue(): unknown }> | null
    polygon:
        | {
              material: unknown
              outlineColor: unknown
              outline: unknown
          }
        | null
        | undefined
    polyline?: {
        material: unknown
        width?: number
    } | null
}

export interface CesiumSceneRuntime {
    pickPositionSupported?: boolean
    pickPosition(windowPosition: unknown): unknown
    globe?: {
        depthTestAgainstTerrain: boolean
        pick(ray: unknown, scene: CesiumSceneRuntime): unknown
    }
    primitives: {
        add(primitive: unknown): void
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
