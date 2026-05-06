import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import type { PoiDraftInput } from '#shared/types/facility'
import { NotificationToneEnum } from '#shared/types/notification-tone.enum'
import { useFacilityStore } from '~/entities/facility/model/useFacilityStore'
import { useFacilitySideeffect } from '~/entities/facility/api/useFacilitySideeffect'
import { useSidewalkSideeffect } from '~/entities/facility/api/useSidewalkSideeffect'
import { useSidewalkStore } from '~/entities/facility/model/useSidewalkStore'
import { useBoundaryStore } from '~/entities/boundary/model/useBoundaryStore'
import { useBoundarySideeffect } from '~/entities/boundary/api/useBoundarySideeffect'
import { useElevationLayerStore } from '~/features/elevation-layer/model/useElevationLayerStore'
import { useElevationLayerSideeffect } from '~/features/elevation-layer/api/useElevationLayerSideeffect'
import { useGradientStore } from '~/entities/gradient/model/useGradientStore'
import { useGradientSideeffect } from '~/entities/gradient/api/useGradientSideeffect'
import {
    findNearestSection,
    validatePoiDistance,
    generatePoiComment
} from '~/entities/route/lib/usePoiSnapping'
import type { SectionPointRange } from '~/entities/route/lib/useRouteDrawDraft'
import type { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'
import type { useNotificationStore } from '~/entities/notification/model/useNotificationStore'
import type { useRouteMapFacade } from './useRouteMapFacade'

type RouteDrawStore = ReturnType<typeof useRouteDrawStore>
type NotificationStore = ReturnType<typeof useNotificationStore>
type DrawingFacade = ReturnType<typeof useRouteMapFacade>['drawing']

interface UseMapLayersFacadeOptions {
    viewer: ShallowRef<CesiumViewer | null>
    drawing: DrawingFacade
    routeDrawStore: RouteDrawStore
    notification: NotificationStore
    hideRoutePolylines: () => void
    showRoutePolylines: () => void
}

export function useMapLayersFacade({
    viewer,
    drawing,
    routeDrawStore,
    notification,
    hideRoutePolylines,
    showRoutePolylines
}: UseMapLayersFacadeOptions) {
    // ─── 편의시설 ────────────────────────────────────────────────────
    const facility = useFacilityStore()
    const sidewalk = useSidewalkStore()
    const facilityEffect = useFacilitySideeffect({
        viewer,
        ...facility,
        onPoiClick: (poi: PoiDraftInput) => {
            if (!drawing.sectionDraft) return

            const ranges = routeDrawStore.sectionPointRanges.value
            const positions = routeDrawStore.drawnPositions.value
            if (!positions?.length || !ranges.length) return

            const sectionGeometries = ranges.map((range: SectionPointRange) => ({
                geom: {
                    coordinates: positions.slice(range.start, range.end + 1)
                }
            }))

            const result = findNearestSection(poi.geom, sectionGeometries)
            if (!result) return

            const status = validatePoiDistance(result.distanceMeters)

            if (status === 'blocked') {
                notification.notify({
                    title: '연결 불가',
                    message: `선택한 시설물이 경로에서 ${Math.round(result.distanceMeters)}m 떨어져 있어 연결할 수 없습니다. (최대 500m)`,
                    tone: NotificationToneEnum.ERROR
                })
                return
            }

            if (status === 'warning') {
                notification.notify({
                    title: '거리 경고',
                    message: `선택한 시설물이 경로에서 ${Math.round(result.distanceMeters)}m 떨어져 있습니다.`,
                    tone: NotificationToneEnum.WARNING
                })
            }

            const enrichedPoi = {
                ...poi,
                description: generatePoiComment(poi.name, result.distanceMeters)
            }

            drawing.addPoiToSection(result.sectionIndex, enrichedPoi)
        }
    })
    useSidewalkSideeffect({ viewer })

    // ─── 행정경계 ────────────────────────────────────────────────────
    const boundary = useBoundaryStore()
    const boundaryEffect = useBoundarySideeffect({ viewer })

    // ─── 고도 시각화 ─────────────────────────────────────────────────
    const elevation = useElevationLayerStore()
    const elevationEffect = useElevationLayerSideeffect({
        viewer,
        isElevationVisible: elevation.isElevationVisible
    })

    // ─── 경사도 시각화 ───────────────────────────────────────────────
    const gradient = useGradientStore()
    const gradientEffect = useGradientSideeffect({
        viewer,
        isGradientVisible: gradient.isGradientVisible,
        drawnPositions: routeDrawStore.drawnPositions,
        setSegments: gradient.setSegments,
        setDifficulty: gradient.setDifficulty,
        hideRoutePolylines,
        showRoutePolylines
    })

    return {
        facility,
        sidewalk,
        facilityEffect,
        boundary,
        boundaryEffect,
        elevation,
        elevationEffect,
        gradient,
        gradientEffect
    }
}
