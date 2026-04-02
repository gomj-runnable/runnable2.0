import type { PoiData } from '#shared/types/theme-map'

export interface MapPrimeEntity {
    [key: string]: unknown
}

interface CesiumCartesian3 {
    x: number
    y: number
    z: number
}

interface CesiumBoundingSphere {
    radius: number
}

interface DivPoiOptions {
    id: string
    maxFeatures: number
    enableDistanceDisplay: boolean
    data: PoiData[]
    template: string
    horizontalOrigin: number
    verticalOrigin: number
    addHeight: number
    pointerEvents: boolean
}

interface MapPrimeViewer {
    camera: {
        heading: number
        pitch: number
        frustum: { fov: number }
        flyToBoundingSphere(
            sphere: CesiumBoundingSphere,
            options: { duration?: number; offset?: unknown }
        ): void
    }
    extend(extension: unknown, options: Record<string, unknown>): void
    _removeDivPOI(id: string): void
    _createDivPOI(options: DivPoiOptions): void
    _removeGraphic(entity: MapPrimeEntity | null): void
    _createEntity(type: string, options: Record<string, unknown>): MapPrimeEntity
}

interface CesiumInstance {
    Viewer: new (container: string, options?: Record<string, unknown>) => MapPrimeViewer
    HorizontalOrigin: { CENTER: number; LEFT: number; RIGHT: number }
    VerticalOrigin: { TOP: number; CENTER: number; BOTTOM: number; BASELINE: number }
    Cartesian3: {
        fromDegrees(longitude: number, latitude: number, height?: number): CesiumCartesian3
    }
    BoundingSphere: {
        fromPoints(positions: CesiumCartesian3[]): CesiumBoundingSphere
    }
    HeadingPitchRange: new (heading: number, pitch: number, range: number) => unknown
}

declare global {
    interface Window {
        Cesium: CesiumInstance
        MapPrime3DExtension: unknown
        MapPrime3D: unknown
        viewer: MapPrimeViewer
    }
}