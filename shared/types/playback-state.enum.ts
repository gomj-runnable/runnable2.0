import { EnumBase } from './enum-base'

export class PlaybackStateEnum extends EnumBase {
    static readonly STOPPED = new PlaybackStateEnum('stopped', '정지')
    static readonly PLAYING = new PlaybackStateEnum('playing', '재생')
    static readonly PAUSED  = new PlaybackStateEnum('paused', '일시정지')

    private constructor(key: string, label: string) { super(key, label) }

    get isStopped(): boolean { return this.key === 'stopped' }
    get isPlaying(): boolean { return this.key === 'playing' }
    get isPaused(): boolean { return this.key === 'paused' }
    get isActive(): boolean { return !this.isStopped }

    static from(key: string): PlaybackStateEnum {
        return EnumBase.fromKey<PlaybackStateEnum>(PlaybackStateEnum, key) ?? PlaybackStateEnum.STOPPED
    }
}
