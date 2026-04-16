import { EnumBase } from './enum-base'

/**
 * PM10 미세먼지 등급 enum class.
 * 등급별 color, label을 인스턴스에 공존시킨다.
 */
export class Pm10GradeEnum extends EnumBase {
    static readonly GOOD = new Pm10GradeEnum('good', '좋음', 'rgba(100, 200, 100, 0.2)')
    static readonly MODERATE = new Pm10GradeEnum('moderate', '보통', 'rgba(250, 220, 50, 0.2)')
    static readonly BAD = new Pm10GradeEnum('bad', '나쁨', 'rgba(255, 150, 50, 0.2)')
    static readonly VERY_BAD = new Pm10GradeEnum('very-bad', '매우나쁨', 'rgba(220, 60, 60, 0.2)')

    private constructor(
        key: string,
        label: string,
        public readonly color: string
    ) {
        super(key, label)
    }

    /** PM10 수치로부터 등급 변환 */
    static fromValue(pm10: number): Pm10GradeEnum {
        if (pm10 <= 30) return Pm10GradeEnum.GOOD
        if (pm10 <= 80) return Pm10GradeEnum.MODERATE
        if (pm10 <= 150) return Pm10GradeEnum.BAD
        return Pm10GradeEnum.VERY_BAD
    }

    /** key 문자열로 인스턴스를 찾는다 */
    static from(key: string): Pm10GradeEnum {
        return EnumBase.fromKey<Pm10GradeEnum>(Pm10GradeEnum, key) ?? Pm10GradeEnum.GOOD
    }
}
