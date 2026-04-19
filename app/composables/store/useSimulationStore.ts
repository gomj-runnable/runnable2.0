import type { PlaybackSpeed, ProgressInfo } from '#shared/types/simulation'
import { PlaybackStateEnum } from '#shared/types/playback-state.enum'

/**
 * 3D 경로 시뮬레이션 재생 상태를 관리하는 store composable.
 * 재생 상태, 속도, 진행률, 진행 정보를 보유한다.
 * 실제 재생 제어 로직은 `useSimulationSideeffect`에 위임한다.
 */
export const useSimulationStore = () => {
    /** 재생 상태 (stopped / playing / paused) */
    const playbackState = useState<PlaybackStateEnum>('simulation.playbackState', () => PlaybackStateEnum.STOPPED)

    /** 재생 속도 배율 */
    const playbackSpeed = useState<PlaybackSpeed>('simulation.playbackSpeed', () => 1)

    /** 전체 진행률 (0~1) */
    const progress = useState<number>('simulation.progress', () => 0)

    /** 현재 진행 정보 (거리, 고도, 경사도) */
    const progressInfo = useState<ProgressInfo | null>('simulation.progressInfo', () => null)

    /** 전체 소요 시간 (ms) */
    const totalDurationMs = useState<number>('simulation.totalDurationMs', () => 0)

    /** 경과 시간 (초) — progress × totalDuration 기반 */
    const elapsedSeconds = computed(() => Math.round((progress.value * totalDurationMs.value) / 1000))

    /** 재생 중 여부 */
    const isPlaying = computed(() => playbackState.value.isPlaying)

    /** 일시정지 여부 */
    const isPaused = computed(() => playbackState.value.isPaused)

    /** 정지 여부 */
    const isStopped = computed(() => playbackState.value.isStopped)

    /** 활성 상태 여부 (재생 또는 일시정지) */
    const isActive = computed(() => playbackState.value.isActive)

    /** 재생 상태를 변경한다. */
    const setPlaybackState = (state: PlaybackStateEnum) => {
        playbackState.value = state
    }

    /** 재생 속도를 변경한다. */
    const setPlaybackSpeed = (speed: PlaybackSpeed) => {
        playbackSpeed.value = speed
    }

    /** 진행률을 갱신한다 (0~1 범위로 클램프). */
    const setProgress = (value: number) => {
        progress.value = Math.max(0, Math.min(1, value))
    }

    /** 진행 정보를 갱신한다. */
    const setProgressInfo = (info: ProgressInfo | null) => {
        progressInfo.value = info
    }

    const setTotalDurationMs = (ms: number) => {
        totalDurationMs.value = ms
    }

    /** 시뮬레이션 상태 전체를 초기값으로 되돌린다. */
    const reset = () => {
        playbackState.value = PlaybackStateEnum.STOPPED
        playbackSpeed.value = 1
        progress.value = 0
        progressInfo.value = null
        totalDurationMs.value = 0
    }

    return {
        playbackState,
        playbackSpeed,
        progress,
        progressInfo,
        isPlaying,
        isPaused,
        isStopped,
        isActive,
        setPlaybackState,
        setPlaybackSpeed,
        setProgress,
        setProgressInfo,
        setTotalDurationMs,
        elapsedSeconds,
        totalDurationMs,
        reset
    }
}
