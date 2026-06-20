import type { CesiumRuntime } from '#shared/types/cesium'
import { useCesiumController } from '~/shared/lib/map/CesiumController'

/**
 * `window.Cesium`에 대한 단일 접근점을 제공하는 Provider composable.
 * 내부적으로 `CesiumController.runtime` 으로 위임한다 — 모든 Cesium 런타임 접근은 컨트롤러로 수렴한다.
 *
 * @throws Error - Cesium이 아직 로드되지 않은 경우
 */
export const getCesiumRuntime = (): CesiumRuntime => useCesiumController().runtime
