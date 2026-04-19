import { EnumBase } from './enum-base'

export class RouteClosingModeEnum extends EnumBase {
    static readonly LOOP_CLOSE = new RouteClosingModeEnum('loop-close', '도착지 연결')
    static readonly ROUND_TRIP = new RouteClosingModeEnum('round-trip', '왕복 코스')

    private constructor(key: string, label: string) { super(key, label) }

    get isLoopClose(): boolean { return this === RouteClosingModeEnum.LOOP_CLOSE }
    get isRoundTrip(): boolean { return this === RouteClosingModeEnum.ROUND_TRIP }

    static from(key: string): RouteClosingModeEnum | null {
        return EnumBase.fromKey<RouteClosingModeEnum>(RouteClosingModeEnum, key) ?? null
    }
}
