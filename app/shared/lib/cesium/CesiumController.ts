import { shallowRef } from 'vue'
import type { ShallowRef } from 'vue'
import type { CesiumRuntime } from '#shared/types/cesium'
import type { CesiumEntity, CesiumViewer } from '~/shared/lib/useWindow'

/**
 * Cesium 런타임(`window.Cesium`)과 Viewer 인스턴스에 대한 단일 접근·제어 진입점.
 * 코어 기능과 플러그인 모두 `cesium` 직접 import / `window.viewer` 대신 이 컨트롤러를 경유한다.
 *
 * 책임은 "런타임·viewer 접근 + entity 저수준 primitive"로 한정한다. terrain 샘플링·보간 등
 * 조합 로직은 operation 레이어(`useTerrainSampler`·`createEntityGroup`)가 `runtime`·`viewer`
 * 를 받아 직접 소유한다.
 *
 * - 런타임 접근: `runtime` (미로드 시 throw)
 * - viewer 참조: `viewer`(반응형) / `setViewer`
 * - primitive: entity(add·remove)
 *
 * viewer 를 인자로 주입받던 기존 헬퍼와의 호환을 위해 entity 메서드는 `viewerOverride` 를
 * 선택적으로 받으며, 미지정 시 컨트롤러가 보유한 viewer 를 쓴다.
 */
export class CesiumController {
    private readonly _viewer: ShallowRef<CesiumViewer | null> = shallowRef(null)

    // Phase 1. Runtime
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

    // Phase 2. Viewer
    /** 반응형 viewer 참조. 소비자는 이 ref 의 준비 상태를 watch 한다 (비반응형 스냅샷은 노출하지 않는다). */
    get viewer(): ShallowRef<CesiumViewer | null> {
        return this._viewer
    }

    /** viewer 인스턴스를 등록/해제한다. 코어(`useMapFeatureInit`)가 getters 후 호출한다. */
    setViewer(viewer: CesiumViewer | null): void {
        this._viewer.value = viewer
    }

    // Phase 3. Entity capability
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
}

/** 앱 전역 단일 CesiumController 인스턴스 (SPA 단일 viewer). */
const controller = new CesiumController()

/** 코어·플러그인 공용 CesiumController 접근점. 코어가 viewer 를 register, 모두가 capability 를 호출한다. */
export const useCesiumController = (): CesiumController => controller
