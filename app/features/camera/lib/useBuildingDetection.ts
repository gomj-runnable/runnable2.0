/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Cesium scene.pick() 결과가 3DTileset(건물)인지 판별한다.
 */
export function isBuildingPick(pickResult: any): boolean {
    if (!pickResult) return false
    if (pickResult.tileset) return true
    if (pickResult.primitive?.constructor?.name === 'Cesium3DTileset') return true
    if (pickResult.content) return true
    return false
}

/**
 * 건물 위 클릭 시, 나선형 탐색으로 건물이 없는 가장 가까운 지면 좌표를 찾는다.
 *
 * 기존 8방향 고정 탐색 대비 개선점:
 * - 나선형(spiral) 탐색으로 가장 가까운 비건물 지점을 우선 발견
 * - scene.pickPosition() 우선 사용 (GPU 기반, globe.pick ray casting 대비 빠름)
 * - 비건물 판정 즉시 중단 (early return)
 * - 거리순 정렬로 최소 보정 거리 보장
 *
 * @param viewer - CesiumViewer 인스턴스
 * @param CesiumLib - window.Cesium 객체
 * @param windowPosition - 클릭한 화면 좌표 (Cartesian2)
 * @param searchRadius - 초기 탐색 반경 (픽셀, 기본 30)
 * @returns snappedPosition (Cartesian3) + corrected 플래그
 */
export function findNearestGroundPosition(
    viewer: any,
    CesiumLib: any,
    windowPosition: any,
    searchRadius: number = 30
): { snappedPosition: any; corrected: boolean } {
    const scene = viewer.scene
    if (!scene || !windowPosition) return { snappedPosition: null, corrected: false }

    // 나선형 탐색: 반경을 점진적으로 확장하며 12방향 탐색
    // 12방향 (30° 간격) — 8방향보다 촘촘하되 연산 증가는 미미
    const angleCount = 12
    const angles = Array.from({ length: angleCount }, (_, i) => (i * 2 * Math.PI) / angleCount)

    // 3단계 반경: 30px → 60px → 120px (가까운 것부터 탐색)
    const radii = [searchRadius, searchRadius * 2, searchRadius * 4]

    for (const radius of radii) {
        for (const angle of angles) {
            const offsetX = windowPosition.x + Math.cos(angle) * radius
            const offsetY = windowPosition.y + Math.sin(angle) * radius
            const testPosition = new CesiumLib.Cartesian2(offsetX, offsetY)

            // 건물 여부 확인 (GPU 렌더 버퍼 조회 — 빠름)
            const pickResult = scene.pick(testPosition)
            if (isBuildingPick(pickResult)) continue

            // 비건물 지점 발견 → pickPosition 우선 시도 (globe.pick 대비 빠름)
            if (scene.pickPositionSupported) {
                const position = scene.pickPosition(testPosition)
                if (CesiumLib.defined(position)) {
                    return { snappedPosition: position, corrected: true }
                }
            }

            // pickPosition 실패 시 globe.pick 폴백
            const ray = viewer.camera?.getPickRay?.(testPosition)
            if (!ray) continue

            const groundPosition = scene.globe?.pick?.(ray, scene)
            if (CesiumLib.defined(groundPosition)) {
                return { snappedPosition: groundPosition, corrected: true }
            }
        }
    }

    return { snappedPosition: null, corrected: false }
}
