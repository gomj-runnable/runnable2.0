import { EnumBase } from './enum-base'

/**
 * 미세먼지 등급 enum class.
 * PM10·PM2.5 수치를 등급으로 변환하고, 복합 등급(합집합 규칙)을 산출한다.
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

    /** PM2.5 수치로부터 등급 변환 */
    static fromPm25Value(pm25: number): Pm10GradeEnum {
        if (pm25 <= 15) return Pm10GradeEnum.GOOD
        if (pm25 <= 35) return Pm10GradeEnum.MODERATE
        if (pm25 <= 75) return Pm10GradeEnum.BAD
        return Pm10GradeEnum.VERY_BAD
    }

    /** PM10·PM2.5 등급 중 상위(나쁜 쪽) 등급을 반환한다 (합집합 규칙) */
    static composite(
        pm10Grade: Pm10GradeEnum | null,
        pm25Grade: Pm10GradeEnum | null
    ): Pm10GradeEnum | null {
        if (!pm10Grade) return pm25Grade
        if (!pm25Grade) return pm10Grade
        const order = [
            Pm10GradeEnum.GOOD,
            Pm10GradeEnum.MODERATE,
            Pm10GradeEnum.BAD,
            Pm10GradeEnum.VERY_BAD
        ]
        const i10 = order.indexOf(pm10Grade)
        const i25 = order.indexOf(pm25Grade)
        return i10 >= i25 ? pm10Grade : pm25Grade
    }

    /** key 문자열로 인스턴스를 찾는다 */
    static from(key: string): Pm10GradeEnum {
        return EnumBase.fromKey<Pm10GradeEnum>(Pm10GradeEnum, key) ?? Pm10GradeEnum.GOOD
    }
}

/** PM10·PM2.5를 포괄하는 미세먼지 등급 별칭 */
export const DustGradeEnum = Pm10GradeEnum
export type DustGradeEnum = Pm10GradeEnum
