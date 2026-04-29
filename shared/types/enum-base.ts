/**
 * Java enum 스타일의 TypeScript enum class 베이스.
 * static readonly 인스턴스와 key/label 속성을 제공한다.
 */
export abstract class EnumBase {
    protected constructor(
        public readonly key: string,
        public readonly label: string
    ) {}

    toString(): string {
        return this.key
    }

    equals(other: EnumBase): boolean {
        return this.key === other.key
    }

    /** enum class의 모든 인스턴스를 배열로 반환한다 */
    static values<T extends EnumBase>(enumClass: Record<string, unknown>): T[] {
        return Object.values(enumClass as Record<string, unknown>).filter(
            (value): value is T => value instanceof EnumBase
        )
    }

    /** key 문자열로 enum 인스턴스를 찾는다 */
    static fromKey<T extends EnumBase>(
        enumClass: Record<string, unknown>,
        key: string
    ): T | undefined {
        return EnumBase.values<T>(enumClass).find((v) => v.key === key)
    }
}
