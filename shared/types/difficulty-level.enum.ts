// 경로 난이도 등급 enum (초급~전문가) — 색상·순서 포함
import { EnumBase } from './enum-base'

export class DifficultyLevelEnum extends EnumBase {
    static readonly BEGINNER = new DifficultyLevelEnum('beginner', '초급', '#4CAF50', 0)
    static readonly INTERMEDIATE = new DifficultyLevelEnum('intermediate', '중급', '#FFC107', 1)
    static readonly ADVANCED = new DifficultyLevelEnum('advanced', '고급', '#FF9800', 2)
    static readonly EXPERT = new DifficultyLevelEnum('expert', '전문가', '#F44336', 3)

    private constructor(
        key: string,
        label: string,
        public readonly color: string,
        public readonly order: number
    ) {
        super(key, label)
    }

    get isBeginner(): boolean {
        return this.key === 'beginner'
    }
    get isIntermediate(): boolean {
        return this.key === 'intermediate'
    }
    get isAdvanced(): boolean {
        return this.key === 'advanced'
    }
    get isExpert(): boolean {
        return this.key === 'expert'
    }

    /** 두 난이도 중 더 높은 것을 반환 */
    static max(a: DifficultyLevelEnum, b: DifficultyLevelEnum): DifficultyLevelEnum {
        return a.order >= b.order ? a : b
    }

    static from(key: string): DifficultyLevelEnum {
        return (
            EnumBase.fromKey<DifficultyLevelEnum>(DifficultyLevelEnum, key) ??
            DifficultyLevelEnum.BEGINNER
        )
    }
}
