import type { Ref, ShallowRef } from 'vue'
import type { MapPrimeEntity, MapPrimeViewer } from '~/composables/useWindow'
import type { SavedRoute, SavedSection } from '#shared/types/route'

interface UseRouteListSideeffectOptions {
    viewer: ShallowRef<MapPrimeViewer | null>
    routes: Ref<SavedRoute[]>
    selectedRouteId: Ref<string | null>
}

const SECTION_COLORS = ['#57B9FF', '#FF7A59', '#7AD957', '#F7C948', '#A78BFA', '#FF5FA2'] as const

/**
 * GeoJSON LineString 문자열을 MapPrimePosition 배열로 변환한다.
 * `window.Cesium.Cartesian3.fromDegrees`를 사용하므로 브라우저 환경에서만 호출해야 한다.
 */
const geomToPositions = (geom: string) => {
    try {
        const parsed = JSON.parse(geom) as { coordinates: [number, number, number?][] }
        return parsed.coordinates.map(([lng, lat, alt]) =>
            window.Cesium.Cartesian3.fromDegrees(lng, lat, alt ?? 0)
        )
    } catch {
        return []
    }
}

/**
 * 경로 목록 조회와 선택된 경로의 구간을 지도에 미리보기로 그리는 sideeffect composable.
 * 선택 해제 또는 드로잉 모드 진입 전 `clearPreview()`를 호출해 지도를 정리한다.
 */
export const useRouteListSideeffect = (options: UseRouteListSideeffectOptions) => {
    const previewPolylines = shallowRef<MapPrimeEntity[]>([])

    /** 지도에 그려진 미리보기 폴리라인을 모두 제거한다. */
    const clearPreview = () => {
        previewPolylines.value.forEach((e) => options.viewer.value?._removeGraphic(e))
        previewPolylines.value = []
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
            options.selectedRouteId.value = null
            return
        }

        options.selectedRouteId.value = routeId

        const sections = await $fetch<SavedSection[]>(`/api/routes/${routeId}/sections`)

        if (!options.viewer.value) return

        previewPolylines.value = sections.flatMap((section, index) => {
            if (!section.geom) return []
            const positions = geomToPositions(section.geom)
            if (positions.length < 2) return []

            const color = SECTION_COLORS[index % SECTION_COLORS.length] ?? SECTION_COLORS[0]

            return [
                options.viewer.value!._createEntity('polyline', {
                    positions,
                    width: 4,
                    clampToGround: true,
                    color,
                    opacity: 0.95
                })
            ]
        })
    }

    return { fetchRoutes, selectRoute, clearPreview }
}
