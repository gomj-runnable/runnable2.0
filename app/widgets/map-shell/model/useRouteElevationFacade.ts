import type { createRouteElevationProfile } from '~/entities/route/lib/useRouteElevationProfile'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'

/**
 * 고도 차트 열기/닫기 상태를 제공하는 sub-facade.
 */
export const useRouteElevationFacade = () => {
    const store = useRouteDrawStore()

    const closeElevationChart = () => {
        store.isElevationChartOpen.value = false
        store.elevationProfile.value = null
    }

    const setElevationChartOpen = (open: boolean) => {
        store.isElevationChartOpen.value = open
    }

    const openElevationChart = (
        title: string,
        profile: ReturnType<typeof createRouteElevationProfile>
    ) => {
        if (!profile) {
            closeElevationChart()
            return
        }

        store.elevationChartTitle.value = title
        store.elevationProfile.value = profile
        store.isElevationChartOpen.value = true
    }

    const elevationChart = reactive({
        open: store.isElevationChartOpen,
        title: store.elevationChartTitle,
        profile: store.elevationProfile,
        setOpen: setElevationChartOpen,
        close: closeElevationChart
    })

    return {
        elevationChart,
        openElevationChart,
        closeElevationChart,
        setElevationChartOpen
    }
}
