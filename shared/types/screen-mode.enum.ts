// 지도 화면 모드 enum (2D/3D)
import { EnumBase } from './enum-base'

export type ScreenModeKey = 'mode2d' | 'mode3d'

export class ScreenModeEnum extends EnumBase<ScreenModeKey> {
    static readonly MODE2D = new ScreenModeEnum('mode2d', '2D')
    static readonly MODE3D = new ScreenModeEnum('mode3d', '3D')

    private constructor(key: ScreenModeKey, label: string) {
        super(key, label)
    }

    get is2D(): boolean {
        return this.key === 'mode2d'
    }

    get is3D(): boolean {
        return this.key === 'mode3d'
    }

    static from(key: string): ScreenModeEnum {
        return EnumBase.fromKey<ScreenModeEnum>(ScreenModeEnum, key) ?? ScreenModeEnum.MODE3D
    }
}
