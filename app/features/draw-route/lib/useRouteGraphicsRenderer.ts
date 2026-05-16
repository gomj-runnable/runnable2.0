import type { Ref, ShallowRef } from 'vue'
import type { CesiumEntity, CesiumViewer } from '~/shared/lib/useWindow'
import { createEntityGroup } from '~/shared/lib/map/useEntityCleanup'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'
import {
    addRoutePointEntity,
    getSectionColor,
    toCesiumColor
} from '~/entities/route/lib/useRouteDrawUtils'
import { createClampedPolyline } from '~/entities/route/lib/useGroundClamping'
import { SECTION_START_MARKER_COLOR } from '#shared/constants/route'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'

interface UseRouteGraphicsRendererOptions {
    viewer: ShallowRef<CesiumViewer | null>
    drawnPositions: Ref<GeoJsonPosition[] | null>
    sectionPointRanges: Ref<Array<{ start: number; end: number }>>
    closingMode?: Ref<RouteClosingModeEnum | null>
}

/**
 * 구간 폴리라인·포인트 렌더링을 담당하는 composable.
 * Cesium 엔티티 생성·제거 로직만 분리하여 관리한다.
 */
export const useRouteGraphicsRenderer = (options: UseRouteGraphicsRendererOptions) => {
    const sectionPolylines = createEntityGroup(options.viewer)
    const sectionPoints = createEntityGroup(options.viewer)

    /**
     * 단일 구간의 폴리라인을 지도에 그린다.
     */
    const drawSection = (
        positions: GeoJsonPosition[],
        sectionIndex: number,
        isDashed = false
    ): CesiumEntity | null => {
        if (!options.viewer.value) {
            return null
        }

        const color = getSectionColor(sectionIndex)
        const Cesium = getCesiumRuntime()
        const material = isDashed
            ? new Cesium.PolylineDashMaterialProperty({
                  color: toCesiumColor(Cesium, color, 0.7),
                  dashLength: 16
              })
            : toCesiumColor(Cesium, color, 0.95)

        return options.viewer.value.entities.add({
            polyline: createClampedPolyline(Cesium, {
                positions,
                width: 4,
                material
            })
        })
    }

    const createRoutePoint = (position: GeoJsonPosition, color: string): CesiumEntity | null => {
        if (!options.viewer.value) {
            return null
        }

        return addRoutePointEntity(getCesiumRuntime(), options.viewer.value, position, color)
    }

    /**
     * 현재 지도에 그려진 모든 구간 폴리라인과 포인트 마커를 제거한다.
     */
    const clearSectionGraphics = () => {
        sectionPolylines.clear()
        sectionPoints.clear()
    }

    /**
     * `sectionPointRanges`를 기준으로 지도의 구간 그래픽을 전체 다시 그린다.
     */
    const redrawSectionGraphics = () => {
        const positions = Array.isArray(options.drawnPositions.value)
            ? options.drawnPositions.value
            : []
        const ranges = options.sectionPointRanges.value

        clearSectionGraphics()

        if (!options.viewer.value || positions.length < 2 || ranges.length === 0) {
            return
        }

        const isRoundTrip = options.closingMode?.value?.isRoundTrip

        sectionPolylines.set(
            ranges
                .map((range, index) => {
                    const sectionPts = positions.slice(range.start, range.end + 1)

                    return sectionPts.length >= 2
                        ? drawSection(sectionPts, index, isRoundTrip)
                        : null
                })
                .filter((entity): entity is CesiumEntity => entity !== null)
        )

        const routePointEntities: CesiumEntity[] = []
        const firstPoint = positions[0]

        if (firstPoint) {
            const startPointEntity = createRoutePoint(firstPoint, SECTION_START_MARKER_COLOR)

            if (startPointEntity) {
                routePointEntities.push(startPointEntity)
            }
        }

        ranges.forEach((range, index) => {
            const endPoint = positions[range.end]

            if (!endPoint) {
                return
            }

            const pointEntity = createRoutePoint(endPoint, getSectionColor(index))

            if (pointEntity) {
                routePointEntities.push(pointEntity)
            }
        })

        sectionPoints.set(routePointEntities)
    }

    return {
        sectionPolylines,
        sectionPoints,
        clearSectionGraphics,
        redrawSectionGraphics
    }
}
