import { describe, it, expect, vi } from 'vitest'

import { usePlaybackStateMachine } from '~/shared/lib/usePlaybackStateMachine'
import { PlaybackStateEnum } from '#shared/types/playback-state.enum'

vi.stubGlobal('readonly', <T>(v: T) => v)

describe('usePlaybackStateMachine', () => {
    it('초기 상태 — STOPPED', () => {
        const machine = usePlaybackStateMachine()
        expect(machine.state.value.key).toBe(PlaybackStateEnum.STOPPED.key)
    })

    it('STOPPED + PLAY → PLAYING', () => {
        const machine = usePlaybackStateMachine()
        expect(machine.send('PLAY')).toBe(true)
        expect(machine.state.value.key).toBe(PlaybackStateEnum.PLAYING.key)
    })

    it('PLAYING + PAUSE → PAUSED', () => {
        const machine = usePlaybackStateMachine()
        machine.send('PLAY')
        expect(machine.send('PAUSE')).toBe(true)
        expect(machine.state.value.key).toBe(PlaybackStateEnum.PAUSED.key)
    })

    it('PAUSED + RESUME → PLAYING', () => {
        const machine = usePlaybackStateMachine()
        machine.send('PLAY')
        machine.send('PAUSE')
        expect(machine.send('RESUME')).toBe(true)
        expect(machine.state.value.key).toBe(PlaybackStateEnum.PLAYING.key)
    })

    it('PLAYING + COMPLETE → STOPPED', () => {
        const machine = usePlaybackStateMachine()
        machine.send('PLAY')
        machine.send('COMPLETE')
        expect(machine.state.value.key).toBe(PlaybackStateEnum.STOPPED.key)
    })

    it('STOPPED + RESUME 은 무효 → false + 상태 유지', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        const machine = usePlaybackStateMachine()
        expect(machine.send('RESUME')).toBe(false)
        expect(machine.state.value.key).toBe(PlaybackStateEnum.STOPPED.key)
    })

    it('canSend — 현재 상태에서 유효한 이벤트만 true', () => {
        const machine = usePlaybackStateMachine()
        expect(machine.canSend('PLAY')).toBe(true)
        expect(machine.canSend('PAUSE')).toBe(false)
        machine.send('PLAY')
        expect(machine.canSend('PAUSE')).toBe(true)
    })

    it('reset — STOPPED 으로 강제 리셋', () => {
        const machine = usePlaybackStateMachine()
        machine.send('PLAY')
        machine.reset()
        expect(machine.state.value.key).toBe(PlaybackStateEnum.STOPPED.key)
    })
})
