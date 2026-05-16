import type { CesiumViewer } from '~/shared/lib/useWindow'
import type { CesiumRuntime } from '#shared/types/cesium'
import { interpolatePath } from '~/features/camera/lib/useFlythroughAction'

export interface PlaybackCameraState {
    lastSetHeading: number
    userHeadingOffset: number
    userPitch: number
}

/** 카메라의 현재 heading과 마지막 설정값의 차이를 사용자 오프셋에 누적한다. pitch는 카메라 값을 직접 읽는다. */
export const captureUserInput = (v: CesiumViewer, state: PlaybackCameraState): void => {
    state.userHeadingOffset += v.camera.heading - state.lastSetHeading
    state.userPitch = v.camera.pitch
}

/** 카메라를 현재 진행률 위치로 이동한다. heading은 경로 방향 + 사용자 오프셋, pitch는 사용자 직접 제어. */
export const updateCamera = (
    Cesium: CesiumRuntime,
    v: CesiumViewer,
    progress: number,
    coordinates: number[][],
    state: PlaybackCameraState
): void => {
    captureUserInput(v, state)

    const pos = interpolatePath(coordinates, progress)
    const heading = Cesium.Math.toRadians(pos.heading) + state.userHeadingOffset

    v.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.elevation),
        orientation: { heading, pitch: state.userPitch, roll: 0 }
    })

    state.lastSetHeading = heading
}
