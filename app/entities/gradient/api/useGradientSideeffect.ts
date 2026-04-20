import type { Ref, ShallowRef } from 'vue'
import type { CesiumEntity, CesiumViewer } from '~/shared/lib/useWindow'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { GradientSegment } from '#shared/types/gradient'
import type { DifficultyLevelEnum } from '#shared/types/difficulty-level.enum'
import { createEntityGroup } from '~/widgets/map-shell/lib/useEntityCleanup'
import { createClampedPolyline } from '~/entities/route/lib/useGroundClamping'
import { toCesiumColor } from '~/entities/route/lib/useRouteDrawUtils'
import { useGradientAction } from '~/entities/gradient/lib/useGradientAction'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { distance, point } from '@turf/turf'

interface GradientSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    isGradientVisible: Ref<boolean>
    drawnPositions: Ref<GeoJsonPosition[] | null>
    setSegments: (segments: GradientSegment[]) => void
    setDifficulty: (level: DifficultyLevelEnum | null) => void
    hideRoutePolylines: () => void
    showRoutePolylines: () => void
}

export const useGradientSideeffect = (options: GradientSideeffectOptions) => {
    const {
        viewer,
        isGradientVisible,
        drawnPositions,
        setSegments,
        setDifficulty,
        hideRoutePolylines,
        showRoutePolylines
    } = options
    const { calculateSegmentGradients, classifyDifficulty } = useGradientAction()
    const gradientPolylines = createEntityGroup(viewer)

    const drawGradientPolylines = (positions: GeoJsonPosition[]) => {
        const v = viewer.value
        if (!v || positions.length < 2) return

        gradientPolylines.clear()
        hideRoutePolylines()

        const segments = calculateSegmentGradients(positions)
        setSegments(segments)

        let totalDistanceKm = 0
        let cumulativeElevGain = 0
        let maxGrad = 0

        for (const seg of segments) {
            const start = positions[seg.startIndex]!
            const end = positions[seg.endIndex]!
            totalDistanceKm += distance(point([start[0], start[1]]), point([end[0], end[1]]), {
                units: 'kilometers'
            })
            const elevDiff = (end[2] ?? 0) - (start[2] ?? 0)
            if (elevDiff > 0) cumulativeElevGain += elevDiff
            maxGrad = Math.max(maxGrad, Math.abs(seg.gradient))
        }

        setDifficulty(classifyDifficulty(totalDistanceKm, cumulativeElevGain, maxGrad))

        const C = getCesiumRuntime()
        const entities = segments.map((seg) => {
            const segPositions = [positions[seg.startIndex]!, positions[seg.endIndex]!]
            return v.entities.add({
                polyline: createClampedPolyline(C, {
                    positions: segPositions,
                    width: 5,
                    material: toCesiumColor(C, seg.color, 0.9)
                })
            })
        })

        gradientPolylines.set(entities as CesiumEntity[])
    }

    const clearGradientPolylines = () => {
        gradientPolylines.clear()
        showRoutePolylines()
        setSegments([])
        setDifficulty(null)
    }

    const init = () => {
        const stopWatch = watch(
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

        onBeforeUnmount(() => {
            stopWatch()
            gradientPolylines.clear()
        })
    }

    return { init }
}
