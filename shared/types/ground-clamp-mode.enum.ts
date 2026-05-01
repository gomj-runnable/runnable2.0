import { EnumBase } from './enum-base'

export class GroundClampModeEnum extends EnumBase {
    static readonly CLAMP = new GroundClampModeEnum('clamp', '지면 고정', true)
    static readonly RELATIVE = new GroundClampModeEnum('relative', '상대 높이', true)
    static readonly NONE = new GroundClampModeEnum('none', '고정 없음', false)

    private constructor(
        key: string,
        label: string,
        /** clampToGround 플래그로 사용할 값 */
        public readonly shouldClamp: boolean
    ) {
        super(key, label)
    }

    get isClamp(): boolean {
        return this.key === 'clamp'
    }
    get isRelative(): boolean {
        return this.key === 'relative'
    }
    get isNone(): boolean {
        return this.key === 'none'
    }

    static from(key: string): GroundClampModeEnum {
        return (
            EnumBase.fromKey<GroundClampModeEnum>(GroundClampModeEnum, key) ??
            GroundClampModeEnum.CLAMP
        )
    }
}
