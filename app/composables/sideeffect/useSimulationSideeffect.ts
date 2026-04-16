import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/composables/useWindow'
import { interpolatePath, getProgressInfo } from '~/composables/action/useFlythroughAction'
import { useSimulationStore } from '~/composables/store/useSimulationStore'

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

    const getCesium = () => window.Cesium

    /** 현재 RAF 루프 ID. null이면 루프가 비활성 상태 */
    let rafId: number | null = null

    /** 마지막 RAF 타임스탬프 */
    let lastTimestamp: number | null = null

    /** 재생 중인 경로 좌표 */
    let activeCoordinates: number[][] = []

    /**
     * 경로 전체 거리를 기준으로 1배속일 때 완주 시간(ms)을 계산한다.
     * 러너 기준 평균 속도 3m/s(약 5:33/km)를 사용한다.
     */
    const RUNNER_SPEED_MPS = 3

    /** RAF 루프 한 프레임 처리 */
    const tick = (timestamp: number) => {
        if (store.playbackState.value !== 'playing') return

        if (lastTimestamp === null) {
            lastTimestamp = timestamp
        }

        const elapsed = timestamp - lastTimestamp
        lastTimestamp = timestamp

        const Cesium = getCesium()
        const v = viewer.value
        if (!v || !Cesium) {
            rafId = requestAnimationFrame(tick)
            return
        }

        // 진행률 증분 계산: 경과 시간 × 속도 배율 / 전체 소요 시간
        const totalDist = activeCoordinates.length > 1
            ? activeCoordinates.reduce((acc, cur, i) => {
                if (i === 0) return 0
                const prev = activeCoordinates[i - 1]!
                const toRad = (d: number) => (d * Math.PI) / 180
                const R = 6371000
                const dLat = toRad(cur[1]! - prev[1]!)
                const dLon = toRad(cur[0]! - prev[0]!)
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(prev[1]!)) * Math.cos(toRad(cur[1]!)) * Math.sin(dLon / 2) ** 2
                return acc + 2 * R * Math.asin(Math.sqrt(a))
              }, 0)
            : 0

        const totalDurationMs = totalDist > 0 ? (totalDist / RUNNER_SPEED_MPS) * 1000 : 10000
        const speedMultiplier = store.playbackSpeed.value
        const delta = (elapsed * speedMultiplier) / totalDurationMs

        const newProgress = store.progress.value + delta

        // 재생 완료 처리
        if (newProgress >= 1) {
            store.setProgress(1)
            store.setProgressInfo(getProgressInfo(activeCoordinates, 1))
            _updateCamera(Cesium, v, 1)
            store.setPlaybackState('stopped')
            lastTimestamp = null
            return
        }

        store.setProgress(newProgress)
        store.setProgressInfo(getProgressInfo(activeCoordinates, newProgress))
        _updateCamera(Cesium, v, newProgress)

        rafId = requestAnimationFrame(tick)
    }

    /** 카메라를 현재 진행률 위치로 이동한다. */
    const _updateCamera = (Cesium: typeof window.Cesium, v: CesiumViewer, progress: number) => {
        const pos = interpolatePath(activeCoordinates, progress)
        v.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.elevation),
            orientation: {
                heading: Cesium.Math.toRadians(pos.heading),
                pitch: Cesium.Math.toRadians(pos.pitch),
                roll: 0
            }
        })
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
     * @param coordinates - GeoJSON [경도, 위도, 고도] 배열
     */
    const startPlayback = (coordinates: number[][]) => {
        _stopRaf()
        activeCoordinates = coordinates
        store.setProgress(0)
        store.setProgressInfo(getProgressInfo(coordinates, 0))
        store.setPlaybackState('playing')
        rafId = requestAnimationFrame(tick)
    }

    /**
     * 재생을 일시정지한다.
     */
    const pausePlayback = () => {
        if (store.playbackState.value !== 'playing') return
        _stopRaf()
        store.setPlaybackState('paused')
    }

    /**
     * 일시정지 상태에서 재생을 재개한다.
     */
    const resumePlayback = () => {
        if (store.playbackState.value !== 'paused') return
        store.setPlaybackState('playing')
        rafId = requestAnimationFrame(tick)
    }

    /**
     * 재생을 완전히 정지하고 초기 카메라 위치로 돌아간다.
     */
    const stopPlayback = () => {
        _stopRaf()
        store.reset()
        activeCoordinates = []
    }

    /**
     * 진행률을 특정 값으로 이동한다 (스크럽).
     * 재생 중이면 해당 위치에서 계속 재생하고, 일시정지 중이면 위치만 갱신한다.
     *
     * @param progress - 0~1
     */
    const seekTo = (progress: number) => {
        if (activeCoordinates.length === 0) return

        store.setProgress(progress)
        store.setProgressInfo(getProgressInfo(activeCoordinates, progress))

        const Cesium = getCesium()
        const v = viewer.value
        if (v && Cesium) {
            _updateCamera(Cesium, v, progress)
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
