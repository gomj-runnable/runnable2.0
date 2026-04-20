import type { CesiumRuntime } from '#shared/types/cesium'

/**
 * window.Cesium에 대한 단일 접근점을 제공하는 Provider composable.
 * 모든 sideeffect 파일은 이 함수를 통해 Cesium에 접근한다.
 *
 * @throws Error - Cesium이 아직 로드되지 않은 경우
 */
export const getCesiumRuntime = (): CesiumRuntime => {
    const cesium = (window as unknown as { Cesium?: CesiumRuntime }).Cesium
    if (!cesium) {
        throw new Error('[useCesiumRuntime] Cesium is not loaded yet. Ensure Cesium script is loaded before calling getCesiumRuntime().')
    }
    return cesium
}
