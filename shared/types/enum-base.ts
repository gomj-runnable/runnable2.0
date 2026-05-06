/**
 * Java enum 스타일의 TypeScript enum class 베이스.
 * static readonly 인스턴스와 key/label 속성을 제공한다.
 *
 * 제네릭 K로 key 리터럴 타입을 좁힐 수 있다. 기본값은 `string`(하위 호환).
 * 예: `class WeatherConditionEnum extends EnumBase<WeatherCondition>`
 */
export abstract class EnumBase<K extends string = string> {
    protected constructor(
        public readonly key: K,
        public readonly label: string
    ) {}

    toString(): K {
        return this.key
    }

    equals(other: EnumBase): boolean {
        return this.key === other.key
    }

    /** enum class의 모든 인스턴스를 배열로 반환한다 */
    static values<T extends EnumBase>(enumClass: object): T[] {
        return Object.values(enumClass as Record<string, unknown>).filter(
            (value): value is T => value instanceof EnumBase
        )
    }

    /** key 문자열로 enum 인스턴스를 찾는다 */
    static fromKey<T extends EnumBase>(enumClass: object, key: string): T | undefined {
        return EnumBase.values<T>(enumClass).find((v) => v.key === key)
    }
}
