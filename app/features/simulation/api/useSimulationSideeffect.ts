import type { ShallowRef } from 'vue'
import { PlaybackStateEnum } from '#shared/types/playback-state.enum'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { interpolatePath, getProgressInfo } from '~/features/camera/lib/useFlythroughAction'
import { useSimulationStore } from '~/features/simulation/model/useSimulationStore'
import { useSectionInfoStore } from '~/entities/route/model/useSectionInfoStore'
import { useCameraViewSideeffect } from '~/features/camera/api/useCameraViewSideeffect'
import { getCesiumRuntime } from '~/shared/lib/map/useCesiumRuntime'
import { usePlaybackStateMachine } from '~/shared/lib/usePlaybackStateMachine'
import {
    buildSpeedProfile,
    timeToDistanceProgress
} from '~/features/simulation/lib/useSpeedProfile'
import { updateCamera, type PlaybackCameraState } from '~/features/simulation/lib/usePlaybackCamera'

interface UseSimulationSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

/**
 * Cesium viewer를 통해 3D 경로 플라이스루 재생을 제어하는 sideeffect composable.
 * requestAnimationFrame 기반 RAF 루프로 카메라를 이동하고,
 * 상태 변경은 useSimulationStore에 위임한다.
 *
 * @param options - Cesium viewer ref
 */
export const useSimulationSideeffect = (options: UseSimulationSideeffectOptions) => {
    const { viewer } = options
    const store = useSimulationStore()
    const sectionInfo = useSectionInfoStore()
    const cameraView = useCameraViewSideeffect({ viewer })
    const playbackMachine = usePlaybackStateMachine()

    /** 현재 RAF 루프 ID. null이면 루프가 비활성 상태 */
    let rafId: number | null = null
    /** 마지막 RAF 타임스탬프 */
    let lastTimestamp: number | null = null
    /** 재생 중인 경로 좌표 */
    let activeCoordinates: number[][] = []
    /** 미리 계산된 전체 소요 시간 (ms) */
    let precomputedTotalDurationMs = 10000
    /** 각 좌표 인덱스의 누적 시간 비율 (0~1) */
    let cumulativeTimeFractions: number[] = []

    /** 카메라 상태 (사용자 입력 오프셋 추적) */
    const cameraState: PlaybackCameraState = {
        lastSetHeading: 0,
        userHeadingOffset: 0,
        userPitch: 0
    }

    /** RAF 루프 한 프레임 처리 */
    const tick = (timestamp: number) => {
        if (!playbackMachine.state.value.isPlaying) return

        if (lastTimestamp === null) lastTimestamp = timestamp
        const elapsed = timestamp - lastTimestamp
        lastTimestamp = timestamp

        const Cesium = getCesiumRuntime()
        const v = viewer.value
        if (!v || !Cesium) {
            rafId = requestAnimationFrame(tick)
            return
        }

        const delta = (elapsed * store.playbackSpeed.value) / precomputedTotalDurationMs
        const newTimeProgress = store.progress.value + delta

        if (newTimeProgress >= 1) {
            store.setProgress(1)
            store.setProgressInfo(getProgressInfo(activeCoordinates, 1))
            updateCamera(Cesium, v, 1, activeCoordinates, cameraState)
            cameraView.restoreThirdPerson()
            playbackMachine.send('COMPLETE')
            store.setPlaybackState(PlaybackStateEnum.STOPPED)
            lastTimestamp = null
            return
        }

        const distanceProgress = timeToDistanceProgress(newTimeProgress, cumulativeTimeFractions)
        store.setProgress(newTimeProgress)
        store.setProgressInfo(getProgressInfo(activeCoordinates, distanceProgress))
        updateCamera(Cesium, v, distanceProgress, activeCoordinates, cameraState)

        rafId = requestAnimationFrame(tick)
    }

    /** RAF 루프를 중단한다. */
    const _stopRaf = () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId)
            rafId = null
        }
        lastTimestamp = null
    }

    /**
     * 재생을 시작한다. 처음 또는 정지 상태에서 진행률 0부터 시작한다.
     * 일시정지 상태에서 동일 경로면 resumePlayback, 다른 경로면 처음부터 시작한다.
     */
    const startPlayback = (coordinates: number[][]) => {
        if (playbackMachine.canSend('RESUME') && coordinates === activeCoordinates) {
            resumePlayback()
            return
        }

        if (playbackMachine.state.value.isActive) {
            playbackMachine.reset()
        }

        _stopRaf()
        activeCoordinates = coordinates
        cameraState.userHeadingOffset = 0

        const profile = buildSpeedProfile(coordinates, sectionInfo)
        precomputedTotalDurationMs = profile.totalDurationMs
        cumulativeTimeFractions = profile.cumulativeTimeFractions
        store.setTotalDurationMs(precomputedTotalDurationMs)

        store.setProgress(0)
        store.setProgressInfo(getProgressInfo(coordinates, 0))

        const Cesium = getCesiumRuntime()
        const v = viewer.value
        if (v && Cesium) {
            cameraView.enableFirstPerson()
            const pos = interpolatePath(coordinates, 0)
            const heading = Cesium.Math.toRadians(pos.heading)
            cameraState.userPitch = Cesium.Math.toRadians(pos.pitch)
            v.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(
                    pos.longitude,
                    pos.latitude,
                    pos.elevation
                ),
                orientation: { heading, pitch: cameraState.userPitch, roll: 0 }
            })
            cameraState.lastSetHeading = heading
        }

        if (!playbackMachine.send('PLAY')) return
        store.setPlaybackState(PlaybackStateEnum.PLAYING)
        rafId = requestAnimationFrame(tick)
    }

    /** 재생을 일시정지한다. */
    const pausePlayback = () => {
        if (!playbackMachine.canSend('PAUSE')) return
        _stopRaf()
        playbackMachine.send('PAUSE')
        store.setPlaybackState(PlaybackStateEnum.PAUSED)
    }

    /** 일시정지 상태에서 재생을 재개한다. */
    const resumePlayback = () => {
        if (!playbackMachine.canSend('RESUME')) return
        playbackMachine.send('RESUME')
        store.setPlaybackState(PlaybackStateEnum.PLAYING)
        rafId = requestAnimationFrame(tick)
    }

    /** 재생을 완전히 정지하고 3인칭 카메라로 복구한다. */
    const stopPlayback = () => {
        _stopRaf()
        if (!playbackMachine.send('STOP')) return
        const v = viewer.value
        if (v) cameraView.restoreThirdPerson()
        store.reset()
        activeCoordinates = []
        cumulativeTimeFractions = []
    }

    /** 진행률을 특정 값으로 이동한다 (스크럽). */
    const seekTo = (progress: number) => {
        if (activeCoordinates.length === 0) return

        const distanceProgress = timeToDistanceProgress(progress, cumulativeTimeFractions)
        store.setProgress(progress)
        store.setProgressInfo(getProgressInfo(activeCoordinates, distanceProgress))

        const Cesium = getCesiumRuntime()
        const v = viewer.value
        if (v && Cesium) {
            updateCamera(Cesium, v, distanceProgress, activeCoordinates, cameraState)
        }
    }

    return {
        startPlayback,
        pausePlayback,
        resumePlayback,
        stopPlayback,
        seekTo
    }
}
