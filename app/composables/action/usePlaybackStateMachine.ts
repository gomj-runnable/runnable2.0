import { PlaybackStateEnum } from '#shared/types/playback-state.enum'

type PlaybackEvent = 'PLAY' | 'PAUSE' | 'RESUME' | 'STOP' | 'COMPLETE'

/** 유효한 상태 전이 맵. 현재 상태 → 이벤트 → 다음 상태 */
const transitions: Map<PlaybackStateEnum, Map<PlaybackEvent, PlaybackStateEnum>> = new Map([
    [
        PlaybackStateEnum.STOPPED,
        new Map<PlaybackEvent, PlaybackStateEnum>([['PLAY', PlaybackStateEnum.PLAYING]])
    ],
    [
        PlaybackStateEnum.PLAYING,
        new Map<PlaybackEvent, PlaybackStateEnum>([
            ['PAUSE', PlaybackStateEnum.PAUSED],
            ['STOP', PlaybackStateEnum.STOPPED],
            ['COMPLETE', PlaybackStateEnum.STOPPED]
        ])
    ],
    [
        PlaybackStateEnum.PAUSED,
        new Map<PlaybackEvent, PlaybackStateEnum>([
            ['RESUME', PlaybackStateEnum.PLAYING],
            ['STOP', PlaybackStateEnum.STOPPED]
        ])
    ]
])

export type { PlaybackEvent }

/**
 * 재생 상태 머신.
 * 유효한 전이만 허용하고, 무효한 전이 시도는 경고 후 현재 상태를 유지한다.
 */
export function usePlaybackStateMachine() {
    const current = ref<PlaybackStateEnum>(PlaybackStateEnum.STOPPED)

    /** 이벤트에 따라 상태를 전이한다. 유효하지 않은 전이면 false를 반환한다. */
    function send(event: PlaybackEvent): boolean {
        const stateTransitions = transitions.get(current.value)
        const nextState = stateTransitions?.get(event)

        if (!nextState) {
            console.warn(
                `[PlaybackStateMachine] invalid transition: ${current.value.key} + ${event}`
            )
            return false
        }

        current.value = nextState
        return true
    }

    /** 특정 이벤트가 현재 상태에서 유효한지 확인한다. */
    function canSend(event: PlaybackEvent): boolean {
        return transitions.get(current.value)?.has(event) ?? false
    }

    /** 상태를 STOPPED으로 강제 리셋한다 (cleanup 용도). */
    function reset() {
        current.value = PlaybackStateEnum.STOPPED
    }

    return {
        state: readonly(current),
        send,
        canSend,
        reset
    }
}
