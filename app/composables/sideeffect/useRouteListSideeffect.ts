import type { Ref, ShallowRef } from 'vue'
import type { MapPrimeEntity, MapPrimePosition, MapPrimeViewer } from '~/composables/useWindow'
import type { GeoJsonLineString, SavedRoute, SavedSection } from '#shared/types/route'
import { SECTION_COLORS, SECTION_START_MARKER_COLOR } from '#shared/constants/route'

interface UseRouteListSideeffectOptions {
    viewer: ShallowRef<MapPrimeViewer | null>
    routes: Ref<SavedRoute[]>
    selectedRouteId: Ref<string | null>
}

/**
 * GeoJSON LineString을 MapPrimePosition 배열로 변환한다.
 * `window.Cesium.Cartesian3.fromDegrees`를 사용하므로 브라우저 환경에서만 호출해야 한다.
 */
const geomToPositions = (geom?: GeoJsonLineString) => {
    if (!geom) {
        return []
    }

    let coords = geom.coordinates

    // 닫힌 좌표(첫 좌표 == 마지막 좌표)가 포함된 경우 제거
    if (coords.length > 1) {
        const first = coords[0]
        const last = coords[coords.length - 1]
        if (first && last && first[0] === last[0] && first[1] === last[1]) {
            coords = coords.slice(0, -1)
        }
    }

    return coords.map(([lng, lat]) => window.Cesium.Cartesian3.fromDegrees(lng, lat, 0))
}

/**
 * 경로 목록 조회와 선택된 경로의 구간을 지도에 미리보기로 그리는 sideeffect composable.
 * 선택 해제 또는 드로잉 모드 진입 전 `clearPreview()`를 호출해 지도를 정리한다.
 */
export const useRouteListSideeffect = (options: UseRouteListSideeffectOptions) => {
    const previewPolylines = shallowRef<MapPrimeEntity[]>([])
    const previewPoints = shallowRef<MapPrimeEntity[][]>([])

    const createRoutePoint = (position: MapPrimePosition, color: string) => {
        if (!options.viewer.value) {
            return []
        }

        return options.viewer.value._createPoint({
            positions: position,
            color,
            opacity: 0.95,
            clampToGround: true
        })
    }

    /** 지도에 그려진 미리보기 폴리라인을 모두 제거한다. */
    const clearPreview = () => {
        previewPolylines.value.forEach((e) => options.viewer.value?._removeGraphic(e))
        previewPoints.value.flat().forEach((e) => options.viewer.value?._removeEntity(e))
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

    /**
     * 경로를 선택하고 해당 구간들을 지도에 그린다.
     * 이미 선택된 경로를 다시 클릭하면 선택을 해제하고 미리보기를 지운다.
     */
    const selectRoute = async (routeId: string) => {
        clearPreview()

        if (options.selectedRouteId.value === routeId) {
            clearSelection()
            return
        }

        const sections = await $fetch<SavedSection[]>(`/api/routes/${routeId}/sections`)
        options.selectedRouteId.value = routeId

        if (!options.viewer.value) return

        const previewSegments = sections
            .map((section) => geomToPositions(section.geom))
            .filter((positions) => positions.length >= 2)

        previewPolylines.value = previewSegments.map((positions, index) => {
            const color = SECTION_COLORS[index % SECTION_COLORS.length] ?? SECTION_COLORS[0]

            return options.viewer.value!._createEntity('polyline', {
                positions,
                width: 4,
                clampToGround: true,
                color,
                opacity: 0.95
            })
        })

        const routePointEntities: MapPrimeEntity[][] = []
        const firstPoint = previewSegments[0]?.[0]

        if (firstPoint) {
            routePointEntities.push(createRoutePoint(firstPoint, SECTION_START_MARKER_COLOR))
        }

        previewSegments.forEach((positions, index) => {
            const endPoint = positions.at(-1)
            const color = SECTION_COLORS[index % SECTION_COLORS.length] ?? SECTION_COLORS[0]

            if (!endPoint) {
                return
            }

            routePointEntities.push(createRoutePoint(endPoint, color))
        })

        previewPoints.value = routePointEntities
    }

    return { fetchRoutes, selectRoute, clearPreview, clearSelection }
}
