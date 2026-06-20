import type { CesiumViewer } from '~/shared/lib/useWindow'
import { useCesiumController } from '~/shared/lib/map/CesiumController'

/**
 * 코어·플러그인 공용 viewer 접근. 내부적으로 `CesiumController` 로 위임한다.
 * 코어가 `setViewer` 로 등록하고, 플러그인은 `viewer.value` 준비를 watch 한다.
 */
export function useMapViewer() {
    const controller = useCesiumController()
    return {
        viewer: controller.viewerRef,
        setViewer: (v: CesiumViewer | null) => controller.setViewer(v)
    }
}
