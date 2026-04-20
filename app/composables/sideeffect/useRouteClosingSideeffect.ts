import type { Ref, ShallowRef } from 'vue'
import type { CesiumEntity, CesiumViewer } from '~/composables/useWindow'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { RouteClosingMode } from '~/composables/store/useRouteClosingStore'
import { toCesiumColor } from '~/composables/action/useRouteDrawUtils'
import { createClampedPolyline } from '~/composables/action/useGroundClamping'
import { createEntityGroup } from '~/composables/action/useEntityCleanup'
import { getCesiumRuntime } from '~/composables/sideeffect/useCesiumRuntime'

/**
 * `useRouteClosingSideeffect`에 주입하는 의존성 옵션.
 */
interface UseRouteClosingSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    drawnPositions: Ref<GeoJsonPosition[] | null>
    closingMode: Ref<RouteClosingMode>
}

/**
 * 경로 마감 모드에 따라 Cesium 미리보기 엔티티를 렌더링하는 sideeffect composable.
 * - loop-close: 마지막 점 → 첫 점을 잇는 반투명 직선
 * - round-trip: 역순 경로에 점선 + 외곽선 효과
 */
export const useRouteClosingSideeffect = (options: UseRouteClosingSideeffectOptions) => {
    /** 마감 모드 미리보기로 지도에 추가한 엔티티 목록 */
    const preview = createEntityGroup(options.viewer)

    /** 현재 마감 미리보기 엔티티를 모두 지도에서 제거한다. */
    const clearClosingPreview = () => {
        preview.clear()
    }

    /** loop-close 모드: 마지막 점에서 첫 점을 잇는 반투명 직선을 그린다. */
    const renderLoopClosePreview = () => {
        const positions = options.drawnPositions.value
        if (!options.viewer.value || !positions || positions.length < 2) return

        const firstPoint = positions[0]!
        const lastPoint = positions[positions.length - 1]!

        const Cesium = getCesiumRuntime()
        const entity = options.viewer.value.entities.add({
            polyline: createClampedPolyline(Cesium, {
                positions: [lastPoint, firstPoint],
                width: 4,
                material: toCesiumColor(Cesium, '#FFFFFF', 0.3)
            })
        })

        preview.set([entity])
    }

    /** round-trip 모드: 역순 경로에 외곽 스트로크와 내부 점선을 겹쳐 그린다. */
    const renderRoundTripPreview = () => {
        const positions = options.drawnPositions.value
        if (!options.viewer.value || !positions || positions.length < 2) return

        const reversedPositions = [...positions].reverse()
        const entities: CesiumEntity[] = []

        const Cesium = getCesiumRuntime()
        // 외곽 스트로크 (넓고 반투명 — 감싸는 효과)
        const outerEntity = options.viewer.value.entities.add({
            polyline: createClampedPolyline(Cesium, {
                positions: reversedPositions,
                width: 8,
                material: toCesiumColor(Cesium, '#FFFFFF', 0.2)
            })
        })
        entities.push(outerEntity)

        // 내부 점선
        const innerEntity = options.viewer.value.entities.add({
            polyline: createClampedPolyline(Cesium, {
                positions: reversedPositions,
                width: 4,
                material: new Cesium.PolylineDashMaterialProperty({
                    color: toCesiumColor(Cesium, '#FFFFFF', 0.7),
                    dashLength: 16
                })
            })
        })
        entities.push(innerEntity)

        preview.set(entities)
    }

    watchEffect(() => {
        const mode = options.closingMode.value
        const positions = options.drawnPositions.value

        clearClosingPreview()

        if (!positions || positions.length < 2) return

        if (mode?.isLoopClose) renderLoopClosePreview()
        else if (mode?.isRoundTrip) renderRoundTripPreview()
    })

    return {
        clearClosingPreview
    }
}
