import type { Ref, ShallowRef } from 'vue'
import type { CesiumEntity, CesiumViewer } from '~/composables/useWindow'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { RouteClosingMode } from '~/composables/store/useRouteClosingStore'
import { toCartesianPosition, toCesiumColor } from '~/composables/action/useRouteDrawUtils'

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
    const previewEntities = shallowRef<CesiumEntity[]>([])

    /** 현재 마감 미리보기 엔티티를 모두 지도에서 제거한다. */
    const clearClosingPreview = () => {
        if (!options.viewer.value) return

        previewEntities.value.forEach((entity) => options.viewer.value?.entities.remove(entity))
        previewEntities.value = []
    }

    /** loop-close 모드: 마지막 점에서 첫 점을 잇는 반투명 직선을 그린다. */
    const renderLoopClosePreview = () => {
        const positions = options.drawnPositions.value
        if (!options.viewer.value || !positions || positions.length < 2) return

        const firstPoint = positions[0]!
        const lastPoint = positions[positions.length - 1]!

        const entity = options.viewer.value.entities.add({
            polyline: {
                positions: [lastPoint, firstPoint].map(toCartesianPosition),
                width: 4,
                clampToGround: true,
                material: toCesiumColor('#FFFFFF', 0.3)
            }
        })

        previewEntities.value = [entity]
    }

    /** round-trip 모드: 역순 경로에 외곽 스트로크와 내부 점선을 겹쳐 그린다. */
    const renderRoundTripPreview = () => {
        const positions = options.drawnPositions.value
        if (!options.viewer.value || !positions || positions.length < 2) return

        const reversedPositions = [...positions].reverse()
        const cartesianPositions = reversedPositions.map(toCartesianPosition)
        const entities: CesiumEntity[] = []

        // 외곽 스트로크 (넓고 반투명 — 감싸는 효과)
        const outerEntity = options.viewer.value.entities.add({
            polyline: {
                positions: cartesianPositions,
                width: 8,
                clampToGround: true,
                material: toCesiumColor('#FFFFFF', 0.2)
            }
        })
        entities.push(outerEntity)

        // 내부 점선
        const Cesium = window.Cesium
        const innerEntity = options.viewer.value.entities.add({
            polyline: {
                positions: cartesianPositions,
                width: 4,
                clampToGround: true,
                material: new Cesium.PolylineDashMaterialProperty({
                    color: toCesiumColor('#FFFFFF', 0.7),
                    dashLength: 16
                })
            }
        })
        entities.push(innerEntity)

        previewEntities.value = entities
    }

    watchEffect(() => {
        const mode = options.closingMode.value
        const positions = options.drawnPositions.value

        clearClosingPreview()

        if (!positions || positions.length < 2) return

        if (mode === 'loop-close') renderLoopClosePreview()
        else if (mode === 'round-trip') renderRoundTripPreview()
    })

    return {
        clearClosingPreview
    }
}
