import { onScopeDispose } from 'vue'
import { createMachine, createActor } from 'xstate'
import { PlaybackStateEnum } from '#shared/types/playback-state.enum'

export type PlaybackEvent = 'PLAY' | 'PAUSE' | 'RESUME' | 'STOP' | 'COMPLETE'

const playbackMachine = createMachine({
    id: 'playback',
    initial: 'stopped',
    states: {
        stopped: { on: { PLAY: 'playing' } },
        playing: { on: { PAUSE: 'paused', STOP: 'stopped', COMPLETE: 'stopped' } },
        paused: { on: { RESUME: 'playing', STOP: 'stopped' } }
    }
})

type PlaybackStateKey = 'stopped' | 'playing' | 'paused'

const stateMap: Record<PlaybackStateKey, PlaybackStateEnum> = {
    stopped: PlaybackStateEnum.STOPPED,
    playing: PlaybackStateEnum.PLAYING,
    paused: PlaybackStateEnum.PAUSED
}

/**
 * XState v5 기반 재생 상태 머신.
 * 유효한 전이만 허용하고, 무효한 전이 시도는 경고 후 현재 상태를 유지한다.
 */
export function usePlaybackStateMachine() {
    const current = ref<PlaybackStateEnum>(PlaybackStateEnum.STOPPED)

    function _createActor() {
        const actor = createActor(playbackMachine)
        const subscription = actor.subscribe((snapshot) => {
            current.value =
                stateMap[snapshot.value as PlaybackStateKey] ?? PlaybackStateEnum.STOPPED
        })
        actor.start()
        return { actor, subscription }
    }

    let { actor, subscription } = _createActor()

    onScopeDispose(() => {
        actor.stop()
    })

    /** 이벤트에 따라 상태를 전이한다. 유효하지 않은 전이면 false를 반환한다. */
    function send(event: PlaybackEvent): boolean {
        if (!actor.getSnapshot().can({ type: event })) {
            console.warn(
                `[PlaybackStateMachine] invalid transition: ${current.value.key} + ${event}`
            )
            return false
        }
        actor.send({ type: event })
        return true
    }

    /** 특정 이벤트가 현재 상태에서 유효한지 확인한다. */
    function canSend(event: PlaybackEvent): boolean {
        return actor.getSnapshot().can({ type: event })
    }

    /** 상태를 STOPPED으로 강제 리셋한다 (cleanup 용도). */
    function reset() {
        subscription.unsubscribe()
        actor.stop()
        ;({ actor, subscription } = _createActor())
    }

    return {
        state: readonly(current),
        send,
        canSend,
        reset
    }
}
