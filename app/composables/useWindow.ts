import type { PoiData } from '#shared/types/theme-map'

/**
 * MapPrime 뷰어가 생성하는 엔티티의 기본 타입.
 * 폴리라인·포인트 등 지도 위에 그려진 그래픽 객체를 참조할 때 사용한다.
 */
export interface MapPrimeEntity {
    [key: string]: unknown
}

/**
 * MapPrime 뷰어 내부의 3D 좌표 표현.
 * Cesium의 Cartesian3 좌표계를 따르며, 지도 위에 그래픽을 배치할 때 사용한다.
 */
export interface MapPrimePosition {
    x: number
    y: number
    z: number
}

/**
 * WGS84 경위도 좌표 쌍 또는 경위도+고도 세 값.
 * GeoJSON LineString의 coordinates 배열 원소 타입으로 사용한다.
 */
export type Wgs84Coordinate = [number, number] | [number, number, number]

/**
 * `_drawAction` 완료 후 MapPrime 뷰어가 반환하는 드로잉 결과 데이터.
 * 거리·면적·좌표 배열 등 경로 생성에 필요한 측정값을 포함한다.
 */
export interface DrawActionData {
    /** 드로잉 영역의 면적 (단위는 `unit` 참조) */
    area?: number
    /** 드로잉 경로의 총 거리 (단위는 `unit` 참조) */
    distance?: number
    /** 경로 각 포인트의 고도 배열 */
    heights?: number[]
    /** GeoJSON 형식의 드로잉 결과 */
    GeoJSON?: Record<string, unknown>
    /** MapPrime 내부 3D 좌표 배열 */
    positions?: MapPrimePosition[]
    /** WGS84 경위도 좌표 배열. `geom` 직렬화 시 내부 좌표보다 우선 사용한다. */
    wgs84Array?: Wgs84Coordinate[]
    /** `distance`·`area`의 단위 문자열 (예: `"m"`, `"km"`) */
    unit?: string
    /** 경로의 평균 해발고도 문자열 */
    averageElevation?: string
    /** 그리드 기반 GeoJSON */
    gridGeoJSON?: Record<string, unknown>
    /** 그리드 샘플 고도 배열 */
    gridSampleHeight?: number[]
}

/**
 * `_drawAction`이 정상 완료되었을 때의 응답 구조.
 * `data`에 드로잉 결과 측정값이 담기고, `state`로 완료 상태를 구분한다.
 */
export interface DrawActionResponse {
    data?: DrawActionData
    state?: string
}

/**
 * `_drawAction`이 실패했을 때의 오류 구조.
 * `message`를 사용자에게 표시하거나 로그에 기록할 때 사용한다.
 */
export interface DrawActionError {
    state?: string
    code?: string
    message?: string
}

/**
 * `_drawAction`의 반환 타입.
 * 성공 시 `DrawActionResponse`, 실패 시 `DrawActionError`, 취소 시 `null`을 가진다.
 */
export type DrawActionResult = DrawActionResponse | DrawActionError | null

/** Cesium BoundingSphere의 반지름 정보. 카메라 flyTo 거리 계산에 사용한다. */
interface CesiumBoundingSphere {
    radius: number
}

/** `_createDivPOI` 호출 시 전달하는 POI 레이어 옵션 */
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

/**
 * `window.viewer`에 할당되는 MapPrime 3D 뷰어 인스턴스 타입.
 * 지도 초기화(`useMapInit`) 후 전역에서 접근하며, 그래픽 생성·제거·드로잉에 사용한다.
 */
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
    /** MapPrime 확장(Extension)을 뷰어에 적용한다. 초기화 시 타일셋·이미지리·카메라 설정에 사용한다. */
    extend(extension: unknown, options: Record<string, unknown>): void
    /** DOM 기반 POI 레이어를 제거한다. */
    _removeDivPOI(id: string): void
    /** DOM 기반 POI 레이어를 생성한다. */
    _createDivPOI(options: DivPoiOptions): void
    /** 엔티티(포인트 등)를 지도에서 제거한다. */
    _removeEntity(entity: MapPrimeEntity | null): void
    /** 그래픽(폴리라인 등)을 지도에서 제거한다. */
    _removeGraphic(entity: MapPrimeEntity | null): void
    /** 지정한 타입의 엔티티(폴리라인·폴리곤 등)를 지도에 추가한다. */
    _createEntity(type: string, options: Record<string, unknown>): MapPrimeEntity
    /** 포인트 마커를 지도에 추가한다. 복수 포인트를 한 번에 생성할 수 있다. */
    _createPoint(options: {
        positions: MapPrimePosition | MapPrimePosition[]
        color?: string
        opacity?: number
        clampToGround?: boolean
    }): MapPrimeEntity[]
    /**
     * 사용자 드로잉 액션을 시작하고 결과를 반환한다.
     * `shapeType: 1`은 폴리라인(경로) 드로잉을 의미한다.
     * 사용자가 우클릭으로 완료하거나 취소하면 Promise가 resolve된다.
     */
    _drawAction(options: {
        shapeType: number
        showLabel?: boolean
        stopDrawElement?: HTMLElement
    }): Promise<DrawActionResult>
}

/** `window.Cesium`에 할당되는 Cesium 라이브러리 인스턴스 타입 */
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
