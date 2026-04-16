import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/composables/useWindow'
import type { RouteDiscoverCard } from '#shared/types/discover'
import { useDiscoverStore } from '~/composables/store/useDiscoverStore'

interface UseDiscoverSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

/**
 * 서울 25개 구의 중심 좌표 (경도, 위도).
 * 구역 선택 시 카메라 이동 기준점으로 사용한다.
 */
const DISTRICT_CENTERS: Record<string, [number, number]> = {
    강남구: [127.0476, 37.5172],
    강동구: [127.1238, 37.5301],
    강북구: [127.0114, 37.6396],
    강서구: [126.8495, 37.5509],
    관악구: [126.9514, 37.4784],
    광진구: [127.0822, 37.5385],
    구로구: [126.8875, 37.4954],
    금천구: [126.8956, 37.4569],
    노원구: [127.0568, 37.6541],
    도봉구: [127.0473, 37.6688],
    동대문구: [127.0407, 37.5744],
    동작구: [126.9398, 37.5124],
    마포구: [126.9097, 37.5663],
    서대문구: [126.9368, 37.5791],
    서초구: [127.0325, 37.4836],
    성동구: [127.0366, 37.5635],
    성북구: [127.0174, 37.5894],
    송파구: [127.1067, 37.5145],
    양천구: [126.8568, 37.5270],
    영등포구: [126.8963, 37.5264],
    용산구: [126.9902, 37.5323],
    은평구: [126.9290, 37.6027],
    종로구: [126.9784, 37.5735],
    중구: [126.9979, 37.5638],
    중랑구: [127.0927, 37.6063]
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
    const flyToDistrict = (district: string) => {
        const v = viewer.value
        const C = window.Cesium
        if (!v || !C) return

        const center = DISTRICT_CENTERS[district]
        if (!center) return

        const [lng, lat] = center
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
