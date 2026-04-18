import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/composables/useWindow'
import { useCameraViewStore } from '~/composables/store/useCameraViewStore'

interface UseCameraViewSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

/**
 * Cesium viewer의 카메라 컨트롤러를 1인칭/3인칭 모드로 전환하는 sideeffect composable.
 * 3인칭 설정을 백업했다가 복원하며, 시점 전환 상태는 useCameraViewStore에 위임한다.
 */
export const useCameraViewSideeffect = (options: UseCameraViewSideeffectOptions) => {
    const { viewer } = options
    const store = useCameraViewStore()

    let savedRotateEventTypes: unknown = undefined
    let savedZoomEventTypes: unknown = undefined
    let savedEnableTilt = true
    let savedEnableRotate = true
    let savedEnableLook = false

    const enableFirstPerson = () => {
        const v = viewer.value
        if (!v) return

        const ctrl = (v as any).screenSpaceCameraController
        if (!ctrl) return

        savedRotateEventTypes = ctrl.rotateEventTypes
        savedZoomEventTypes = ctrl.zoomEventTypes
        savedEnableTilt = ctrl.enableTilt
        savedEnableRotate = ctrl.enableRotate
        savedEnableLook = ctrl.enableLook

        ctrl.enableRotate = false
        ctrl.enableTilt = false
        ctrl.enableZoom = false
        ctrl.enableTranslate = false
        ctrl.enableLook = true

        store.setFirstPerson()
    }

    const restoreThirdPerson = () => {
        const v = viewer.value
        if (!v) return

        const ctrl = (v as any).screenSpaceCameraController
        if (!ctrl) return

        ctrl.enableRotate = savedEnableRotate
        ctrl.enableTilt = savedEnableTilt
        ctrl.enableZoom = true
        ctrl.enableTranslate = true
        ctrl.enableLook = savedEnableLook

        if (savedRotateEventTypes !== undefined) {
            ctrl.rotateEventTypes = savedRotateEventTypes
        }
        if (savedZoomEventTypes !== undefined) {
            ctrl.zoomEventTypes = savedZoomEventTypes
        }

        store.setThirdPerson()
    }

    return { enableFirstPerson, restoreThirdPerson }
}
