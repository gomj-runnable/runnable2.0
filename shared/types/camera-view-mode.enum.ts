import { EnumBase } from './enum-base'

export class CameraViewModeEnum extends EnumBase {
    static readonly FIRST_PERSON = new CameraViewModeEnum('first-person', '1인칭')
    static readonly THIRD_PERSON = new CameraViewModeEnum('third-person', '3인칭')

    private constructor(key: string, label: string) { super(key, label) }

    get isFirstPerson(): boolean { return this.key === 'first-person' }
    get isThirdPerson(): boolean { return this.key === 'third-person' }

    static from(key: string): CameraViewModeEnum {
        return EnumBase.fromKey<CameraViewModeEnum>(CameraViewModeEnum, key) ?? CameraViewModeEnum.THIRD_PERSON
    }
}
