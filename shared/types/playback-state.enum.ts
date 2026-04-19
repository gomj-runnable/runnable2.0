import { EnumBase } from './enum-base'

export class PlaybackStateEnum extends EnumBase {
    static readonly STOPPED = new PlaybackStateEnum('stopped', '정지')
    static readonly PLAYING = new PlaybackStateEnum('playing', '재생')
    static readonly PAUSED  = new PlaybackStateEnum('paused', '일시정지')

    private constructor(key: string, label: string) { super(key, label) }

    get isStopped(): boolean { return this === PlaybackStateEnum.STOPPED }
    get isPlaying(): boolean { return this === PlaybackStateEnum.PLAYING }
    get isPaused(): boolean { return this === PlaybackStateEnum.PAUSED }
    get isActive(): boolean { return !this.isStopped }

    static from(key: string): PlaybackStateEnum {
        return EnumBase.fromKey<PlaybackStateEnum>(PlaybackStateEnum, key) ?? PlaybackStateEnum.STOPPED
    }
}
