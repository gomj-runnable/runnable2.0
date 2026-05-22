import { describe, it, expect } from 'vitest'
import { useSimulationStore } from '../useSimulationStore'
import { PlaybackStateEnum } from '#shared/types/playback-state.enum'

describe('useSimulationStore', () => {
    it('초기값: stopped, speed=1, progress=0, info=null, total=0', () => {
        const s = useSimulationStore()

        expect(s.playbackState.value).toEqual(PlaybackStateEnum.STOPPED)
        expect(s.playbackSpeed.value).toBe(1)
        expect(s.progress.value).toBe(0)
        expect(s.progressInfo.value).toBeNull()
        expect(s.totalDurationMs.value).toBe(0)
        expect(s.elapsedSeconds.value).toBe(0)
        expect(s.isStopped.value).toBe(true)
        expect(s.isActive.value).toBe(false)
    })

    it('setPlaybackState 가 isPlaying / isPaused / isStopped computed 에 반영', () => {
        const s = useSimulationStore()

        s.setPlaybackState(PlaybackStateEnum.PLAYING)
        expect(s.isPlaying.value).toBe(true)
        expect(s.isPaused.value).toBe(false)

        s.setPlaybackState(PlaybackStateEnum.PAUSED)
        expect(s.isPlaying.value).toBe(false)
        expect(s.isPaused.value).toBe(true)
        expect(s.isActive.value).toBe(true)
    })

    it('setProgress 는 0~1 범위로 클램프', () => {
        const s = useSimulationStore()

        s.setProgress(0.5)
        expect(s.progress.value).toBe(0.5)

        s.setProgress(-1)
        expect(s.progress.value).toBe(0)

        s.setProgress(99)
        expect(s.progress.value).toBe(1)
    })

    it('elapsedSeconds 는 progress × totalDurationMs / 1000 (반올림)', () => {
        const s = useSimulationStore()
        s.setTotalDurationMs(60_000) // 60초
        s.setProgress(0.25)
        expect(s.elapsedSeconds.value).toBe(15)
    })

    it('setPlaybackSpeed / setProgressInfo 반영', () => {
        const s = useSimulationStore()
        s.setPlaybackSpeed(4)
        expect(s.playbackSpeed.value).toBe(4)

        const info = { distanceM: 1, elevationM: 2, gradeRatio: 0.01 } as any
        s.setProgressInfo(info)
        expect(s.progressInfo.value).toEqual(info)
    })

    it('reset 은 모든 상태를 초기값으로 되돌린다', () => {
        const s = useSimulationStore()
        s.setPlaybackState(PlaybackStateEnum.PLAYING)
        s.setPlaybackSpeed(2)
        s.setProgress(0.7)
        s.setProgressInfo({ distanceM: 1 } as any)
        s.setTotalDurationMs(99)

        s.reset()

        expect(s.playbackState.value).toEqual(PlaybackStateEnum.STOPPED)
        expect(s.playbackSpeed.value).toBe(1)
        expect(s.progress.value).toBe(0)
        expect(s.progressInfo.value).toBeNull()
        expect(s.totalDurationMs.value).toBe(0)
    })
})
