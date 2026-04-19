import { EnumBase } from './enum-base'

export class DifficultyLevelEnum extends EnumBase {
    static readonly BEGINNER     = new DifficultyLevelEnum('beginner', '초급', '#4CAF50', 0)
    static readonly INTERMEDIATE = new DifficultyLevelEnum('intermediate', '중급', '#FFC107', 1)
    static readonly ADVANCED     = new DifficultyLevelEnum('advanced', '고급', '#FF9800', 2)
    static readonly EXPERT       = new DifficultyLevelEnum('expert', '전문가', '#F44336', 3)

    private constructor(
        key: string,
        label: string,
        public readonly color: string,
        public readonly order: number
    ) {
        super(key, label)
    }

    get isBeginner(): boolean     { return this === DifficultyLevelEnum.BEGINNER }
    get isIntermediate(): boolean { return this === DifficultyLevelEnum.INTERMEDIATE }
    get isAdvanced(): boolean     { return this === DifficultyLevelEnum.ADVANCED }
    get isExpert(): boolean       { return this === DifficultyLevelEnum.EXPERT }

    /** 두 난이도 중 더 높은 것을 반환 */
    static max(a: DifficultyLevelEnum, b: DifficultyLevelEnum): DifficultyLevelEnum {
        return a.order >= b.order ? a : b
    }

    static from(key: string): DifficultyLevelEnum {
        return EnumBase.fromKey<DifficultyLevelEnum>(DifficultyLevelEnum, key) ?? DifficultyLevelEnum.BEGINNER
    }
}
