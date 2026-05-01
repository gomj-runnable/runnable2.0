import { EnumBase } from './enum-base'

/**
 * 경로 최적화 모드 enum class.
 * 모드별 label, requiresServer 속성을 인스턴스에 공존시킨다.
 */
export class RouteOptimizationModeEnum extends EnumBase {
    static readonly NONE = new RouteOptimizationModeEnum('NONE', '없음', false)
    static readonly TMAP = new RouteOptimizationModeEnum('TMAP', 'TMap 보행자', true)
    static readonly OSRM = new RouteOptimizationModeEnum('OSRM', 'OSRM 보행자', true)
    static readonly BUILDING_AVOID = new RouteOptimizationModeEnum(
        'BUILDING-AVOID',
        '건물 회피',
        false
    )

    private constructor(
        key: string,
        label: string,
        public readonly requiresServer: boolean
    ) {
        super(key, label)
    }

    /** 서버 라우팅이 필요한 모드인지 판별 */
    get isServerRouted(): boolean {
        return this.requiresServer
    }

    /** key 문자열로 인스턴스를 찾는다 */
    static from(key: string): RouteOptimizationModeEnum {
        return (
            EnumBase.fromKey<RouteOptimizationModeEnum>(RouteOptimizationModeEnum, key) ??
            RouteOptimizationModeEnum.NONE
        )
    }
}
