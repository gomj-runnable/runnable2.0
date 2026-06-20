import { shallowRef } from 'vue'
import type { ShallowRef } from 'vue'
import type { Cartographic } from 'cesium'
import type { CesiumRuntime } from '#shared/types/cesium'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { CesiumEntity, CesiumViewer } from '~/shared/lib/useWindow'
import { densifyPositions } from '~/shared/lib/map/densifyPositions'

/**
 * Cesium 런타임(`window.Cesium`)과 Viewer 인스턴스에 대한 단일 접근·제어 진입점.
 * 코어 기능과 플러그인 모두 `cesium` 직접 import / `window.viewer` 대신 이 컨트롤러를 경유한다.
 *
 * - 런타임 접근: `runtime` (미로드 시 throw), `isRuntimeReady`
 * - viewer 참조: `viewerRef`(반응형) / `viewer` / `setViewer`
 * - capability: entity(add·remove) · terrain(sample·densify)
 *
 * viewer 를 인자로 주입받던 기존 헬퍼(`useTerrainSampler`·`createEntityGroup`)와의 호환을 위해
 * capability 메서드는 `viewerOverride` 를 선택적으로 받으며, 미지정 시 컨트롤러가 보유한 viewer 를 쓴다.
 */
export class CesiumController {
    private readonly _viewer: ShallowRef<CesiumViewer | null> = shallowRef(null)

    // ─── Runtime ─────────────────────────────────────────────
    /** `window.Cesium` 런타임 네임스페이스. 아직 로드되지 않았으면 throw. */
    get runtime(): CesiumRuntime {
        const cesium = (window as unknown as { Cesium?: CesiumRuntime }).Cesium
        if (!cesium) {
            throw new Error(
                '[CesiumController] Cesium is not loaded yet. Ensure Cesium script is loaded before accessing the runtime.'
            )
        }
        return cesium
    }

    /** Cesium 런타임 로드 여부 (throw 없이 확인). */
    get isRuntimeReady(): boolean {
        return !!(window as unknown as { Cesium?: CesiumRuntime }).Cesium
    }

    // ─── Viewer ──────────────────────────────────────────────
    /** 반응형 viewer 참조. 플러그인은 이 ref 의 준비 상태를 watch 한다. */
    get viewerRef(): ShallowRef<CesiumViewer | null> {
        return this._viewer
    }

    /** 현재 viewer 인스턴스. 미초기화 시 null. */
    get viewer(): CesiumViewer | null {
        return this._viewer.value
    }

    /** viewer 인스턴스를 등록/해제한다. 코어(`useMapFeatureInit`)가 init 후 호출한다. */
    setViewer(viewer: CesiumViewer | null): void {
        this._viewer.value = viewer
    }

    // ─── Entity capability ───────────────────────────────────
    /** 엔티티 옵션을 viewer 에 추가하고 추가된 엔티티를 반환한다. viewer 미준비 시 null. */
    addEntity(
        options: Record<string, unknown>,
        viewerOverride?: ShallowRef<CesiumViewer | null>
    ): CesiumEntity | null {
        const v = (viewerOverride ?? this._viewer).value
        if (!v) return null
        return v.entities.add(options)
    }

    /** 엔티티를 viewer 에서 제거한다. viewer 미준비 시 무동작. */
    removeEntity(entity: CesiumEntity, viewerOverride?: ShallowRef<CesiumViewer | null>): void {
        const v = (viewerOverride ?? this._viewer).value
        v?.entities.remove(entity)
    }

    // ─── Terrain capability ──────────────────────────────────
    /**
     * 위치 배열의 고도를 Cesium 지형 프로바이더로 샘플링한다.
     * viewer 미준비·Cesium 미로드·샘플링 실패 시 원본 배열을 그대로 반환한다.
     */
    async sampleTerrain(
        positions: GeoJsonPosition[],
        viewerOverride?: ShallowRef<CesiumViewer | null>
    ): Promise<GeoJsonPosition[]> {
        const v = (viewerOverride ?? this._viewer).value
        if (!v || positions.length === 0) return positions

        const C = this.runtime
        const cartographics = positions.map(([lng, lat]) => C.Cartographic.fromDegrees(lng, lat))

        try {
            const sampled = await C.sampleTerrainMostDetailed(v.terrainProvider, cartographics)
            return sampled.map(
                (c: Cartographic) =>
                    [
                        C.Math.toDegrees(c.longitude),
                        C.Math.toDegrees(c.latitude),
                        c.height ?? 0
                    ] as GeoJsonPosition
            )
        } catch {
            return positions
        }
    }

    /** 좌표 배열을 보간(densify)한 뒤 지형 고도를 샘플링한다. */
    async densifyAndSample(
        positions: GeoJsonPosition[],
        viewerOverride?: ShallowRef<CesiumViewer | null>
    ): Promise<GeoJsonPosition[]> {
        return this.sampleTerrain(densifyPositions(positions), viewerOverride)
    }

    /** 구간 입력 배열의 각 좌표를 보간+샘플링하여 반환한다 (terrain 단일 배치 호출). */
    async densifyAndSampleSections<T extends { positions: GeoJsonPosition[] }>(
        sections: T[],
        viewerOverride?: ShallowRef<CesiumViewer | null>
    ): Promise<T[]> {
        const densified = sections.map((s) => densifyPositions(s.positions))
        const sampled = await this.sampleTerrain(densified.flat(), viewerOverride)

        let offset = 0
        return sections.map((s, i) => {
            const len = densified[i]!.length
            const positions = sampled.slice(offset, offset + len)
            offset += len
            return { ...s, positions }
        })
    }
}

/** 앱 전역 단일 CesiumController 인스턴스 (SPA 단일 viewer). */
const controller = new CesiumController()

/** 코어·플러그인 공용 CesiumController 접근점. 코어가 viewer 를 register, 모두가 capability 를 호출한다. */
export const useCesiumController = (): CesiumController => controller
