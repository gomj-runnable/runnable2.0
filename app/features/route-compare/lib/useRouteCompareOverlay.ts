import type { ShallowRef } from 'vue'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { SavedSection } from '#shared/types/route'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { createClampedPolyline } from '~/entities/route/lib/useGroundClamping'
import { geomToRouteDrawPositions, toCesiumColor } from '~/entities/route/lib/useRouteDrawUtils'
import { createEntityGroup } from '~/shared/lib/map/useEntityCleanup'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'

/** 비교 overlay 에서 A 경로에 사용할 색상 (파랑 계열) */
export const ROUTE_COMPARE_COLOR_A = '#3B82F6'
/** 비교 overlay 에서 B 경로에 사용할 색상 (빨강 계열) */
export const ROUTE_COMPARE_COLOR_B = '#EF4444'

/**
 * 두 경로(A/B)를 하나의 Cesium viewer 위에 서로 다른 색상 polyline 으로 겹쳐 표시하는 lib (#187).
 *
 * 사용 측은 `setRoutes(aSections, bSections)` 로 sections 배열을 넘기면 두 polyline 을 렌더하고,
 * `clear()` 로 일괄 제거한다.
 */
export const useRouteCompareOverlay = (viewer: ShallowRef<CesiumViewer | null>) => {
    const group = createEntityGroup(viewer)

    const flattenSections = (sections: SavedSection[]): GeoJsonPosition[] =>
        sections.flatMap((s) => geomToRouteDrawPositions(s.geom))

    const drawRoute = (positions: GeoJsonPosition[], color: string) => {
        if (positions.length < 2) return
        const C = getCesiumRuntime()
        group.add({
            polyline: createClampedPolyline(C, {
                positions,
                width: 5,
                material: toCesiumColor(C, color, 0.9)
            })
        })
    }

    const setRoutes = (aSections: SavedSection[], bSections: SavedSection[]) => {
        group.clear()
        drawRoute(flattenSections(aSections), ROUTE_COMPARE_COLOR_A)
        drawRoute(flattenSections(bSections), ROUTE_COMPARE_COLOR_B)
    }

    const clear = () => group.clear()

    return { setRoutes, clear }
}
