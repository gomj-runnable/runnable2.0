import type { createRouteElevationProfile } from '~/entities/route/lib/useRouteElevationProfile'
import { useRouteDrawStore } from '~/entities/route/model/useRouteDrawStore'

/**
 * 경로 고도 그래프 상태/제어를 단일 책임 단위로 노출하는 facade.
 *
 * 실제 elevation 계산은 `useRouteElevationProfile` lib에 있고,
 * 본 facade는 store와 결합한 차트 open/close/setOpen 책임만 진다.
 *
 * #112 결정(8분할, 점진적 마이그레이션, `useXxxFacade` 명명) 반영.
 */
export const useRouteElevationFacade = () => {
    const store = useRouteDrawStore()

    const close = () => {
        store.isElevationChartOpen.value = false
        store.elevationProfile.value = null
    }

    const setOpen = (open: boolean) => {
        store.isElevationChartOpen.value = open
    }

    const open = (title: string, profile: ReturnType<typeof createRouteElevationProfile>) => {
        if (!profile) {
            close()
            return
        }
        store.elevationChartTitle.value = title
        store.elevationProfile.value = profile
        store.isElevationChartOpen.value = true
    }

    return {
        isOpen: store.isElevationChartOpen,
        title: store.elevationChartTitle,
        profile: store.elevationProfile,
        open,
        close,
        setOpen
    }
}
