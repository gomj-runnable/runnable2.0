import type { Cartesian3, Entity, Viewer } from 'cesium'
import type { RouteGeoJson } from '#shared/types/route'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { CommonError, CommonResponse } from '#shared/types/common'

/**
 * Cesium Viewer가 생성하는 엔티티의 기본 타입.
 * 폴리라인·포인트 등 지도 위에 그려진 그래픽 객체를 참조할 때 사용한다.
 */
export type CesiumEntity = Entity

/**
 * `_drawAction` 완료 후 Cesium 드로잉 helper가 반환하는 드로잉 결과 데이터.
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
    GeoJSON?: RouteGeoJson
    /** Cesium 내부 3D 좌표 배열 */
    positions?: Cartesian3[]
    /** WGS84 기반 GeoJSON Position 배열. `geom` 직렬화 시 내부 좌표보다 우선 사용한다. */
    wgs84Array?: GeoJsonPosition[]
    /** `distance`·`area`의 단위 문자열 (예: `"m"`, `"km"`) */
    unit?: string
    /** 경로의 평균 해발고도 문자열 */
    averageElevation?: string
    /** 그리드 기반 GeoJSON */
    gridGeoJSON?: RouteGeoJson
    /** 그리드 샘플 고도 배열 */
    gridSampleHeight?: number[]
}

/**
 * `_drawAction`의 반환 타입.
 * 성공 시 `CommonResponse<DrawActionData>`, 실패 시 `CommonError`, 취소 시 `null`을 가진다.
 */
export type DrawActionResult = CommonResponse<DrawActionData> | CommonError | null

/**
 * `window.viewer`에 할당되는 Cesium Viewer 인스턴스 타입.
 * 지도 초기화(`useMapInit`) 후 전역에서 접근하며, 그래픽 생성·제거·드로잉에 사용한다.
 */
export interface CesiumViewer extends Viewer {
    screenSpaceCameraController: {
        rotateEventTypes: unknown
        zoomEventTypes: unknown
        enableRotate: boolean
        enableTilt: boolean
        enableZoom: boolean
        enableTranslate: boolean
        enableLook: boolean
    }
    /**
     * 앱이 Cesium 위에 직접 올린 폴리라인 드로잉 helper.
     * `shapeType: 1`은 폴리라인(경로) 드로잉을 의미한다.
     * 사용자가 우클릭으로 완료하거나 취소하면 Promise가 resolve된다.
     */
    _drawAction(options: {
        shapeType: number
        showLabel?: boolean
        stopDrawElement?: HTMLElement
    }): Promise<DrawActionResult>
    /** 진행 중인 Cesium 드로잉 helper를 취소한다. */
    _cancelDrawAction(): void
}

declare global {
    interface Window {
        /** 동적으로 로드된 Cesium 라이브러리 전역 참조 */
        Cesium: typeof import('cesium')
        /** `useMapInit`에서 초기화한 Cesium Viewer 전역 인스턴스 */
        viewer: CesiumViewer
    }
}
