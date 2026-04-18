import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/composables/useWindow'
import type { RouteDiscoverCard } from '#shared/types/discover'
import { useDiscoverStore } from '~/composables/store/useDiscoverStore'
import { useDistrictStore } from '~/composables/store/useDistrictStore'

interface UseDiscoverSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

/** 구역 선택 시 카메라 고도 (meters) */
const DISTRICT_FLY_ALTITUDE = 8000

/**
 * 경로 탐색 화면의 API 호출과 카메라 이동을 관리하는 sideeffect composable.
 * `selectedDistrict` 변경 시 `/api/routes/discover`를 호출하고, 해당 구역으로 카메라를 이동한다.
 */
export const useDiscoverSideeffect = (options: UseDiscoverSideeffectOptions) => {
    const { viewer } = options
    const { selectedDistrict, discoverRoutes, sortBy, isLoading } = useDiscoverStore()
    const district = useDistrictStore()

    /**
     * `/api/routes/discover`에서 구역별 경로 목록을 가져와 `discoverRoutes`를 갱신한다.
     *
     * @param district - 조회할 행정구 이름. 없으면 전체 조회.
     */
    const fetchRoutes = async (district?: string | null) => {
        isLoading.value = true
        try {
            const params = new URLSearchParams()
            if (district) params.set('district', district)
            params.set('sortBy', sortBy.value)
            discoverRoutes.value = await $fetch<RouteDiscoverCard[]>(
                `/api/routes/discover?${params.toString()}`
            )
        } catch {
            discoverRoutes.value = []
        } finally {
            isLoading.value = false
        }
    }

    /**
     * 선택된 구역의 중심 좌표로 Cesium 카메라를 부드럽게 이동한다.
     *
     * @param district - 이동할 행정구 이름
     */
    const flyToDistrict = (name: string) => {
        const v = viewer.value
        const C = window.Cesium
        if (!v || !C) return

        const gu = district.guByName.value.get(name)
        if (!gu) return

        const { lng, lat } = gu
        v.camera.flyTo({
            destination: C.Cartesian3.fromDegrees(lng, lat, DISTRICT_FLY_ALTITUDE),
            duration: 1.5
        })
    }

    /**
     * 경로 탐색 sideeffect를 초기화한다.
     * `selectedDistrict` 변화를 감시하고, 변경 시 경로 조회와 카메라 이동을 수행한다.
     */
    const init = () => {
        watch(
            selectedDistrict,
            async (district) => {
                await fetchRoutes(district)
                if (district) flyToDistrict(district)
            },
            { immediate: true }
        )
    }

    return {
        init,
        fetchRoutes,
        flyToDistrict
    }
}
