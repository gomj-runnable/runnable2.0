import type { Ref, ShallowRef } from 'vue'
import type { CesiumEntity, CesiumViewer } from '~/composables/useWindow'
import type { RouteSectionBase, SavedRoute, SavedSection } from '#shared/types/route'
import type { GeoJsonPosition } from '#shared/types/geojson'
import { SECTION_START_MARKER_COLOR } from '#shared/constants/route'
import {
    addRoutePointEntity,
    geomToRouteDrawPositions,
    getSectionColor,
    toCartesianPosition,
    toCesiumColor
} from '~/composables/action/useRouteDrawUtils'

interface UseRouteListSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
    routes: Ref<SavedRoute[]>
    selectedRouteId: Ref<string | null>
}

/**
 * 경로 목록 조회와 선택된 경로의 구간을 지도에 미리보기로 그리는 sideeffect composable.
 * 선택 해제 또는 드로잉 모드 진입 전 `clearPreview()`를 호출해 지도를 정리한다.
 */
export const useRouteListSideeffect = (options: UseRouteListSideeffectOptions) => {
    const previewPolylines = shallowRef<CesiumEntity[]>([])
    const previewPoints = shallowRef<CesiumEntity[]>([])

    const toPreviewSegments = (sections: RouteSectionBase[]) =>
        sections
            .map((section) => geomToRouteDrawPositions(section.geom))
            .filter((positions) => positions.length >= 2)

    const createRoutePoint = (position: GeoJsonPosition, color: string) => {
        if (!options.viewer.value) {
            return null
        }

        return addRoutePointEntity(options.viewer.value, position, color)
    }

    /** 지도에 그려진 미리보기 폴리라인을 모두 제거한다. */
    const clearPreview = () => {
        previewPolylines.value.forEach((entity) => options.viewer.value?.entities.remove(entity))
        previewPoints.value.forEach((entity) => options.viewer.value?.entities.remove(entity))
        previewPolylines.value = []
        previewPoints.value = []
    }

    /** 목록에서 선택된 경로와 section 상세 상태를 초기화한다. */
    const clearSelection = () => {
        options.selectedRouteId.value = null
    }

    /** 서버에서 전체 경로 목록을 가져와 store에 반영한다. */
    const fetchRoutes = async () => {
        options.routes.value = await $fetch<SavedRoute[]>('/api/routes')
    }

    /** 특정 경로의 section 목록을 서버에서 가져온다. */
    const fetchRouteSections = (routeId: string) =>
        $fetch<SavedSection[]>(`/api/routes/${routeId}/sections`)

    /**
     * 경로를 선택하고 해당 구간들을 지도에 그린다.
     * 이미 선택된 경로를 다시 클릭하면 선택을 해제하고 미리보기를 지운다.
     */
    const selectRoute = async (routeId: string): Promise<SavedSection[] | null> => {
        clearPreview()

        if (options.selectedRouteId.value === routeId) {
            clearSelection()
            return null
        }

        const sections = await fetchRouteSections(routeId)
        options.selectedRouteId.value = routeId

        if (!options.viewer.value) {
            return sections
        }

        const previewSegments = toPreviewSegments(sections)

        previewPolylines.value = previewSegments.map((positions, index) => {
            const color = getSectionColor(index)

            return options.viewer.value!.entities.add({
                polyline: {
                    positions: positions.map(toCartesianPosition),
                    width: 4,
                    clampToGround: true,
                    material: toCesiumColor(color, 0.95)
                }
            })
        })

        const routePointEntities: CesiumEntity[] = []
        const firstPoint = previewSegments[0]?.[0]

        if (firstPoint) {
            const startPointEntity = createRoutePoint(firstPoint, SECTION_START_MARKER_COLOR)

            if (startPointEntity) {
                routePointEntities.push(startPointEntity)
            }
        }

        previewSegments.forEach((positions, index) => {
            const endPoint = positions.at(-1)
            const color = getSectionColor(index)

            if (!endPoint) {
                return
            }

            const pointEntity = createRoutePoint(endPoint, color)

            if (pointEntity) {
                routePointEntities.push(pointEntity)
            }
        })

        previewPoints.value = routePointEntities

        return sections
    }

    return { fetchRoutes, fetchRouteSections, selectRoute, clearPreview, clearSelection }
}
