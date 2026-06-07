import { ScreenModeEnum } from '#shared/types/screen-mode.enum'

/**
 * 지도 화면 모드(2D/3D) 상태를 관리하는 store composable.
 * 실제 카메라 전환(시점 이동·틸트 잠금·가드)은 `useViewModeSideeffect`에 위임한다.
 */
export const useViewModeStore = () => {
    /** 현재 화면 모드 */
    const screenMode = useState<ScreenModeEnum>('viewMode.screenMode', () => ScreenModeEnum.MODE3D)

    /** 카메라 전환(flyTo) 진행 중 여부. 전환 중 재토글을 막는다. */
    const isTransitioning = useState<boolean>('viewMode.isTransitioning', () => false)

    /** 2D 모드 여부 */
    const is2D = computed(() => screenMode.value.is2D)

    /** 3D 모드 여부 */
    const is3D = computed(() => screenMode.value.is3D)

    /** 화면 모드를 명시적으로 설정한다. */
    const setMode = (mode: ScreenModeEnum) => {
        screenMode.value = mode
    }

    /** 2D ↔ 3D 모드를 토글한다. 전환 중에는 무시한다. */
    const toggle = () => {
        if (isTransitioning.value) return
        screenMode.value = screenMode.value.is2D ? ScreenModeEnum.MODE3D : ScreenModeEnum.MODE2D
    }

    /** 전환 진행 상태를 갱신한다. (sideeffect 전용) */
    const setTransitioning = (value: boolean) => {
        isTransitioning.value = value
    }

    return {
        screenMode,
        isTransitioning,
        is2D,
        is3D,
        setMode,
        toggle,
        setTransitioning
    }
}
