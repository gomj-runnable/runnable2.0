// 베이스맵 종류 enum (V-World 위성영상 / 기본지도)
import { EnumBase } from './enum-base'

export type BaseMapKey = 'satellite' | 'base'

export class BaseMapEnum extends EnumBase<BaseMapKey> {
    static readonly SATELLITE = new BaseMapEnum('satellite', '위성영상')
    static readonly BASE = new BaseMapEnum('base', '기본지도')

    private constructor(key: BaseMapKey, label: string) {
        super(key, label)
    }

    get isSatellite(): boolean {
        return this.key === 'satellite'
    }

    static from(key: string): BaseMapEnum {
        return EnumBase.fromKey<BaseMapEnum>(BaseMapEnum, key) ?? BaseMapEnum.SATELLITE
    }
}
