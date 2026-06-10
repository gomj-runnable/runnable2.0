import type { Cartesian3, Color, MaterialProperty, Property } from 'cesium'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { CesiumRuntime } from '#shared/types/cesium'
import { GroundClampModeEnum } from '#shared/types/ground-clamp-mode.enum'

// ─── Polyline ────────────────────────────────────────────────────

export interface ClampedPolylineParams {
    /** WGS84 좌표 배열 — 내부에서 Cartesian3로 변환한다 */
    positions: GeoJsonPosition[]
    /** 폴리라인 너비 (px, 기본 4) */
    width?: number
    /** Cesium material (Color, DashMaterial 등) */
    material?: Color | MaterialProperty
    /** 지면 고정 모드 (기본 CLAMP) */
    mode?: GroundClampModeEnum
}

/**
 * 지면 고정 폴리라인 옵션을 생성한다.
 * `clampToGround` 설정과 좌표 변환을 캡슐화한다.
 *
 * @param cesium - Cesium 런타임 객체 (DI)
 * @param params - 폴리라인 파라미터
 */
export const createClampedPolyline = (
    cesium: CesiumRuntime,
    params: ClampedPolylineParams
): {
    positions: Cartesian3[]
    width: number
    clampToGround: boolean
    material: Color | MaterialProperty | undefined
} => ({
    positions: params.positions.map(([lng, lat, h = 0]) =>
        cesium.Cartesian3.fromDegrees(lng, lat, h)
    ),
    width: params.width ?? 4,
    clampToGround: (params.mode ?? GroundClampModeEnum.CLAMP).shouldClamp,
    material: params.material
})

// ─── Point ───────────────────────────────────────────────────────

export interface ClampedPointParams {
    /** 포인트 채우기 색상 (Cesium Color 또는 Property) */
    color: Color | Property
    /** 포인트 크기 (px, 기본 10) */
    pixelSize?: number
    /** 외곽선 색상 (기본 White) */
    outlineColor?: Color | Property
    /** 외곽선 너비 (px, 기본 2) */
    outlineWidth?: number
    /** 지면 고정 모드 (기본 CLAMP) */
    mode?: GroundClampModeEnum
}

/**
 * 지면 고정 포인트 옵션을 생성한다.
 * `heightReference`와 `disableDepthTestDistance`를 캡슐화한다.
 *
 * @param cesium - Cesium 런타임 객체 (DI)
 * @param params - 포인트 파라미터
 */
export const createClampedPoint = (cesium: CesiumRuntime, params: ClampedPointParams) => {
    const mode = params.mode ?? GroundClampModeEnum.CLAMP

    return {
        pixelSize: params.pixelSize ?? 10,
        color: params.color,
        outlineColor: params.outlineColor ?? cesium.Color.WHITE,
        outlineWidth: params.outlineWidth ?? 2,
        heightReference: mode.isNone
            ? cesium.HeightReference.NONE
            : cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
    }
}
