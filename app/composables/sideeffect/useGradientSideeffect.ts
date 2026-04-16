import type { Ref, ShallowRef } from 'vue'
import type { CesiumEntity, CesiumViewer } from '~/composables/useWindow'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { GradientSegment, DifficultyLevel } from '#shared/types/gradient'
import { createEntityGroup } from '~/composables/action/useEntityCleanup'
import { createClampedPolyline } from '~/composables/action/useGroundClamping'
import { toCesiumColor } from '~/composables/action/useRouteDrawUtils'
import { useGradientAction } from '~/composables/action/useGradientAction'
import { distance, point } from '@turf/turf'

interface GradientSideeffectOptions {
    /** 초기화된 Cesium 뷰어 인스턴스 ref */
    viewer: ShallowRef<CesiumViewer | null>
    /** 경사도 레이어 표시 여부 ref */
    isGradientVisible: Ref<boolean>
    /** 드로잉 완료된 경로 포인트 배열 ref */
    drawnPositions: Ref<GeoJsonPosition[] | null>
    /** 경사도 세그먼트 배열 업데이트 콜백 */
    setSegments: (segments: GradientSegment[]) => void
    /** 난이도 업데이트 콜백 */
    setDifficulty: (level: DifficultyLevel | null) => void
}

/**
 * 경사도 색상 폴리라인 레이어를 Cesium 지도에 렌더링하는 sideeffect composable.
 * isGradientVisible 또는 drawnPositions가 바뀔 때마다 폴리라인을 갱신한다.
 * ON: 구간별 경사도 색상 폴리라인을 추가한다.
 * OFF: 경사도 폴리라인을 제거한다.
 *
 * @param options - 뷰어·상태·콜백을 포함한 의존성 옵션
 */
export const useGradientSideeffect = (options: GradientSideeffectOptions) => {
    const { viewer, isGradientVisible, drawnPositions, setSegments, setDifficulty } = options
    const { calculateSegmentGradients, classifyDifficulty } = useGradientAction()

    /** 경사도 색상 폴리라인 엔티티 그룹 */
    const gradientPolylines = createEntityGroup(viewer)

    /**
     * 경사도 색상 폴리라인 엔티티를 지도에 추가한다.
     * 기존 엔티티는 먼저 제거한다.
     */
    const drawGradientPolylines = (positions: GeoJsonPosition[]) => {
        const v = viewer.value
        if (!v || positions.length < 2) return

        gradientPolylines.clear()

        const segments = calculateSegmentGradients(positions)
        setSegments(segments)

        // 난이도 계산
        let totalDistanceKm = 0
        let cumulativeElevGain = 0
        let maxGrad = 0

        for (const seg of segments) {
            const start = positions[seg.startIndex]!
            const end = positions[seg.endIndex]!
            totalDistanceKm += distance(
                point([start[0], start[1]]),
                point([end[0], end[1]]),
                { units: 'kilometers' }
            )
            const elevDiff = (end[2] ?? 0) - (start[2] ?? 0)
            if (elevDiff > 0) cumulativeElevGain += elevDiff
            maxGrad = Math.max(maxGrad, Math.abs(seg.gradient))
        }

        setDifficulty(classifyDifficulty(totalDistanceKm, cumulativeElevGain, maxGrad))

        // 구간별 폴리라인 엔티티 추가
        const entities = segments
            .map((seg) => {
                const segPositions = [positions[seg.startIndex]!, positions[seg.endIndex]!]
                return v.entities.add({
                    polyline: createClampedPolyline({
                        positions: segPositions,
                        width: 5,
                        material: toCesiumColor(seg.color, 0.9)
                    })
                })
            })

        gradientPolylines.set(entities as CesiumEntity[])
    }

    /**
     * 경사도 폴리라인 엔티티를 지도에서 제거하고 상태를 초기화한다.
     */
    const clearGradientPolylines = () => {
        gradientPolylines.clear()
        setSegments([])
        setDifficulty(null)
    }

    const init = () => {
        watch(
            [isGradientVisible, drawnPositions] as const,
            ([visible, positions]) => {
                if (visible && positions && positions.length >= 2) {
                    drawGradientPolylines(positions)
                } else {
                    clearGradientPolylines()
                }
            },
            { immediate: true }
        )
    }

    return { init }
}
