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
    CallbackProperty: new (callback: () => Cartesian3[], isConstant: boolean) => CallbackProperty
    Color: {
        WHITE: Color
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
    camera: {
        getPickRay(windowPosition: unknown): unknown
        setView(options: unknown): void
    }
    imageryLayers?: {
        removeAll(): void
        addImageryProvider(provider: unknown): void
    }
    terrainProvider?: unknown
}
