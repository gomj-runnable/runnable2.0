import type { ShallowRef } from 'vue'
import { PlaybackStateEnum } from '#shared/types/playback-state.enum'
import type { CesiumViewer } from '~/composables/useWindow'
import type { CesiumRuntime } from '#shared/types/cesium'
import {
    interpolatePath,
    getProgressInfo,
    haversineDistance
} from '~/composables/action/useFlythroughAction'
import { useSimulationStore } from '~/composables/store/useSimulationStore'
import { useSectionInfoStore } from '~/composables/store/useSectionInfoStore'
import { calculateSectionDistance } from '~/composables/action/usePaceCalculator'
import { useCameraViewSideeffect } from '~/composables/sideeffect/useCameraViewSideeffect'
import { getCesiumRuntime } from '~/composables/sideeffect/useCesiumRuntime'
import { usePlaybackStateMachine } from '~/composables/action/usePlaybackStateMachine'

interface UseSimulationSideeffectOptions {
    viewer: ShallowRef<CesiumViewer | null>
}

/** 기본 페이스: 6:00/km = 360초/km */
const DEFAULT_PACE_SEC_PER_KM = 360

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

    /** 마지막으로 프로그래밍 방식으로 설정한 heading (rad) */
    let lastSetHeading = 0

    /** 사용자 마우스 회전에 의한 heading 오프셋 (rad) */
    let userHeadingOffset = 0

    /** 사용자가 직접 제어하는 pitch (rad). 경로 pitch에 영향받지 않는다. */
    let userPitch = 0

    /** 미리 계산된 전체 소요 시간 (ms) */
    let precomputedTotalDurationMs = 10000

    /**
     * 각 좌표 인덱스의 누적 시간 비율 (0~1).
     * 구간별 페이스가 다르면 시간 기반으로 진행률을 거리에 매핑한다.
     */
    let cumulativeTimeFractions: number[] = []

    /**
     * 구간별 페이스를 기반으로 전체 소요 시간과 시간-거리 매핑을 미리 계산한다.
     * 구간 데이터가 없으면 기본 페이스(6:00/km)를 사용한다.
     */
    const _buildSpeedProfile = (coordinates: number[][]) => {
        const sections = sectionInfo.sections.value
        const userPaces = sectionInfo.userPaces.value

        // 각 좌표 세그먼트의 거리(m)를 계산
        const segmentDistances: number[] = [0]
        for (let i = 1; i < coordinates.length; i++) {
            segmentDistances.push(haversineDistance(coordinates[i - 1]!, coordinates[i]!))
        }

        // 구간별 좌표 범위와 페이스를 매핑
        // 구간 데이터가 있으면 각 구간의 거리 누적으로 좌표가 어느 구간에 속하는지 판별
        const sectionBoundaries: { endDistance: number; paceSecPerKm: number }[] = []

        if (sections.length > 0) {
            let cumDist = 0
            for (const section of sections) {
                const sectionDistKm = calculateSectionDistance(section)
                cumDist += sectionDistKm * 1000 // m 단위
                const pace = userPaces[section.sectionId]?.pace ?? DEFAULT_PACE_SEC_PER_KM
                sectionBoundaries.push({ endDistance: cumDist, paceSecPerKm: pace })
            }
        }

        // 각 좌표의 누적 거리와 소요 시간 계산
        const cumulativeDist: number[] = [0]
        const cumulativeTime: number[] = [0]
        let totalDist = 0

        for (let i = 1; i < coordinates.length; i++) {
            totalDist += segmentDistances[i]!
            cumulativeDist.push(totalDist)

            // 현재 좌표가 속하는 구간의 페이스 결정
            let paceSecPerKm = DEFAULT_PACE_SEC_PER_KM
            if (sectionBoundaries.length > 0) {
                for (const boundary of sectionBoundaries) {
                    if (totalDist <= boundary.endDistance) {
                        paceSecPerKm = boundary.paceSecPerKm
                        break
                    }
                }
                // 마지막 구간을 넘어선 좌표는 마지막 구간 페이스 사용
                if (totalDist > sectionBoundaries[sectionBoundaries.length - 1]!.endDistance) {
                    paceSecPerKm = sectionBoundaries[sectionBoundaries.length - 1]!.paceSecPerKm
                }
            }

            // 이 세그먼트의 소요 시간 = 거리(km) × 페이스(초/km)
            const segmentTimeMs = (segmentDistances[i]! / 1000) * paceSecPerKm * 1000
            cumulativeTime.push(cumulativeTime[i - 1]! + segmentTimeMs)
        }

        const totalTimeMs = cumulativeTime[cumulativeTime.length - 1] ?? 10000
        precomputedTotalDurationMs = totalTimeMs > 0 ? totalTimeMs : 10000

        // 시간 비율 배열 생성 (progress 0~1 → 시간 기반)
        cumulativeTimeFractions = cumulativeTime.map((t) => t / precomputedTotalDurationMs)
    }

    /**
     * 시간 기반 progress(0~1)를 거리 기반 progress(0~1)로 변환한다.
     * 구간별 페이스가 다르면 빠른 구간은 같은 시간에 더 많은 거리를 이동한다.
     */
    const _timeToDistanceProgress = (timeProgress: number): number => {
        const len = cumulativeTimeFractions.length
        if (len < 2) return timeProgress

        // 이진 탐색으로 timeProgress가 속하는 세그먼트를 찾는다
        let lo = 1
        let hi = len - 1
        while (lo < hi) {
            const mid = (lo + hi) >>> 1
            if (cumulativeTimeFractions[mid]! < timeProgress) lo = mid + 1
            else hi = mid
        }

        const i = lo
        const prevTime = cumulativeTimeFractions[i - 1]!
        const currTime = cumulativeTimeFractions[i]!
        const segmentRatio =
            currTime > prevTime ? (timeProgress - prevTime) / (currTime - prevTime) : 0

        const prevDist = (i - 1) / (len - 1)
        const currDist = i / (len - 1)
        return prevDist + segmentRatio * (currDist - prevDist)
    }

    /** RAF 루프 한 프레임 처리 */
    const tick = (timestamp: number) => {
        if (!playbackMachine.state.value.isPlaying) return

        if (lastTimestamp === null) {
            lastTimestamp = timestamp
        }

        const elapsed = timestamp - lastTimestamp
        lastTimestamp = timestamp

        const Cesium = getCesiumRuntime()
        const v = viewer.value
        if (!v || !Cesium) {
            rafId = requestAnimationFrame(tick)
            return
        }

        // 시간 기반 진행률 증분
        const speedMultiplier = store.playbackSpeed.value
        const delta = (elapsed * speedMultiplier) / precomputedTotalDurationMs

        const newTimeProgress = store.progress.value + delta

        // 재생 완료 처리
        if (newTimeProgress >= 1) {
            store.setProgress(1)
            store.setProgressInfo(getProgressInfo(activeCoordinates, 1))
            _updateCamera(Cesium, v, 1)
            cameraView.restoreThirdPerson()
            playbackMachine.send('COMPLETE')
            store.setPlaybackState(PlaybackStateEnum.STOPPED)
            lastTimestamp = null
            return
        }

        // 시간 진행률 → 거리 진행률 변환
        const distanceProgress = _timeToDistanceProgress(newTimeProgress)

        store.setProgress(newTimeProgress)
        store.setProgressInfo(getProgressInfo(activeCoordinates, distanceProgress))
        _updateCamera(Cesium, v, distanceProgress)

        rafId = requestAnimationFrame(tick)
    }

    /** 카메라의 현재 heading과 마지막 설정값의 차이를 사용자 오프셋에 누적한다. pitch는 카메라 값을 직접 읽는다. */
    const _captureUserInput = (v: CesiumViewer) => {
        userHeadingOffset += v.camera.heading - lastSetHeading
        userPitch = v.camera.pitch
    }

    /** 카메라를 현재 진행률 위치로 이동한다. heading은 경로 방향 + 사용자 오프셋, pitch는 사용자 직접 제어. */
    const _updateCamera = (Cesium: CesiumRuntime, v: CesiumViewer, progress: number) => {
        _captureUserInput(v)

        const pos = interpolatePath(activeCoordinates, progress)
        const heading = Cesium.Math.toRadians(pos.heading) + userHeadingOffset

        v.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.elevation),
            orientation: { heading, pitch: userPitch, roll: 0 }
        })

        lastSetHeading = heading
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
     * @param coordinates - GeoJSON [경도, 위도, 고도] 배열
     */
    const startPlayback = (coordinates: number[][]) => {
        if (playbackMachine.canSend('RESUME') && coordinates === activeCoordinates) {
            resumePlayback()
            return
        }

        // 일시정지 상태에서 다른 경로가 들어오면 상태 머신을 리셋한다
        if (playbackMachine.state.value.isActive) {
            playbackMachine.reset()
        }

        _stopRaf()
        activeCoordinates = coordinates
        userHeadingOffset = 0

        // 구간별 페이스 기반 속도 프로필 구축
        _buildSpeedProfile(coordinates)
        store.setTotalDurationMs(precomputedTotalDurationMs)

        store.setProgress(0)
        store.setProgressInfo(getProgressInfo(coordinates, 0))

        // 초기 시작 방향으로 카메라를 설정하고 1인칭 모드로 전환한다
        const Cesium = getCesiumRuntime()
        const v = viewer.value
        if (v && Cesium) {
            cameraView.enableFirstPerson()
            const pos = interpolatePath(coordinates, 0)
            const heading = Cesium.Math.toRadians(pos.heading)
            userPitch = Cesium.Math.toRadians(pos.pitch)
            v.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(
                    pos.longitude,
                    pos.latitude,
                    pos.elevation
                ),
                orientation: { heading, pitch: userPitch, roll: 0 }
            })
            lastSetHeading = heading
        }

        if (!playbackMachine.send('PLAY')) return
        store.setPlaybackState(PlaybackStateEnum.PLAYING)
        rafId = requestAnimationFrame(tick)
    }

    /**
     * 재생을 일시정지한다.
     */
    const pausePlayback = () => {
        if (!playbackMachine.canSend('PAUSE')) return
        _stopRaf()
        playbackMachine.send('PAUSE')
        store.setPlaybackState(PlaybackStateEnum.PAUSED)
    }

    /**
     * 일시정지 상태에서 재생을 재개한다.
     */
    const resumePlayback = () => {
        if (!playbackMachine.canSend('RESUME')) return
        playbackMachine.send('RESUME')
        store.setPlaybackState(PlaybackStateEnum.PLAYING)
        rafId = requestAnimationFrame(tick)
    }

    /**
     * 재생을 완전히 정지하고 3인칭 카메라로 복구한다.
     */
    const stopPlayback = () => {
        _stopRaf()
        if (!playbackMachine.send('STOP')) return
        const v = viewer.value
        if (v) cameraView.restoreThirdPerson()
        store.reset()
        activeCoordinates = []
        cumulativeTimeFractions = []
    }

    /**
     * 진행률을 특정 값으로 이동한다 (스크럽).
     * 재생 중이면 해당 위치에서 계속 재생하고, 일시정지 중이면 위치만 갱신한다.
     *
     * @param progress - 0~1 (시간 기반)
     */
    const seekTo = (progress: number) => {
        if (activeCoordinates.length === 0) return

        const distanceProgress = _timeToDistanceProgress(progress)
        store.setProgress(progress)
        store.setProgressInfo(getProgressInfo(activeCoordinates, distanceProgress))

        const Cesium = getCesiumRuntime()
        const v = viewer.value
        if (v && Cesium) {
            _updateCamera(Cesium, v, distanceProgress)
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
