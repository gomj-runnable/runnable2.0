// 경로 닫기 모드 enum (도착지 연결 루프 / 왕복 코스)
import { EnumBase } from './enum-base'

export class RouteClosingModeEnum extends EnumBase {
    static readonly LOOP_CLOSE = new RouteClosingModeEnum('loop-close', '도착지 연결')
    static readonly ROUND_TRIP = new RouteClosingModeEnum('round-trip', '왕복 코스')

    private constructor(key: string, label: string) {
        super(key, label)
    }

    get isLoopClose(): boolean {
        return this.key === 'loop-close'
    }
    get isRoundTrip(): boolean {
        return this.key === 'round-trip'
    }

    static from(key: string): RouteClosingModeEnum | null {
        return EnumBase.fromKey<RouteClosingModeEnum>(RouteClosingModeEnum, key) ?? null
    }
}
