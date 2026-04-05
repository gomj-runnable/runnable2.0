import type { PoiData } from '#shared/types/theme-map'

export interface MapPrimeEntity {
    [key: string]: unknown
}

export interface MapPrimePosition {
    x: number
    y: number
    z: number
}

export type Wgs84Coordinate = [number, number] | [number, number, number]

export interface DrawActionData {
    area?: number
    distance?: number
    heights?: number[]
    GeoJSON?: Record<string, unknown>
    positions?: MapPrimePosition[]
    wgs84Array?: Wgs84Coordinate[]
    unit?: string
    averageElevation?: string
    gridGeoJSON?: Record<string, unknown>
    gridSampleHeight?: number[]
}

export interface DrawActionResponse {
    data?: DrawActionData
    state?: string
}

export interface DrawActionError {
    state?: string
    code?: string
    message?: string
}

export type DrawActionResult = DrawActionResponse | DrawActionError | null

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

export interface MapPrimeViewer {
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
    _removeEntity(entity: MapPrimeEntity | null): void
    _removeGraphic(entity: MapPrimeEntity | null): void
    _createEntity(type: string, options: Record<string, unknown>): MapPrimeEntity
    _createPoint(options: {
        positions: MapPrimePosition | MapPrimePosition[]
        color?: string
        opacity?: number
        clampToGround?: boolean
    }): MapPrimeEntity[]
    _drawAction(options: {
        shapeType: number
        showLabel?: boolean
        stopDrawElement?: HTMLElement
    }): Promise<DrawActionResult>
}

interface CesiumInstance {
    Viewer: new (container: string, options?: Record<string, unknown>) => MapPrimeViewer
    HorizontalOrigin: { CENTER: number; LEFT: number; RIGHT: number }
    VerticalOrigin: { TOP: number; CENTER: number; BOTTOM: number; BASELINE: number }
    Cartesian3: {
        fromDegrees(longitude: number, latitude: number, height?: number): MapPrimePosition
    }
    BoundingSphere: {
        fromPoints(positions: MapPrimePosition[]): CesiumBoundingSphere
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
