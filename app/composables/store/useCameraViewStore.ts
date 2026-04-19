import { CameraViewModeEnum } from '#shared/types/camera-view-mode.enum'

export type CameraViewMode = CameraViewModeEnum

/**
 * 카메라 시점 모드 상태를 관리하는 store composable.
 * 1인칭(first-person)과 3인칭(third-person) 전환 상태를 보유한다.
 * 실제 카메라 이동 로직은 `useCameraViewSideeffect`에 위임한다.
 */
export const useCameraViewStore = () => {
    /** 현재 카메라 시점 모드 */
    const viewMode = useState<CameraViewModeEnum>('cameraView.viewMode', () => CameraViewModeEnum.THIRD_PERSON)

    /** 1인칭 시점 여부 */
    const isFirstPerson = computed(() => viewMode.value.isFirstPerson)

    /** 3인칭 시점 여부 */
    const isThirdPerson = computed(() => viewMode.value.isThirdPerson)

    /** 카메라 시점을 1인칭으로 전환한다. */
    const setFirstPerson = () => {
        viewMode.value = CameraViewModeEnum.FIRST_PERSON
    }

    /** 카메라 시점을 3인칭으로 전환한다. */
    const setThirdPerson = () => {
        viewMode.value = CameraViewModeEnum.THIRD_PERSON
    }

    return {
        viewMode,
        isFirstPerson,
        isThirdPerson,
        setFirstPerson,
        setThirdPerson,
    }
}
