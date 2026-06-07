// 그래픽 품질 레벨 enum (자동/높음/중간/낮음)
import { EnumBase } from './enum-base'

export type GraphicQualityKey = 'auto' | 'high' | 'medium' | 'low'

/** 자동을 제외한 실제 렌더링 프리셋이 존재하는 고정 품질 레벨 key */
export type FixedQualityKey = Exclude<GraphicQualityKey, 'auto'>

export class GraphicQualityEnum extends EnumBase<GraphicQualityKey> {
    static readonly AUTO = new GraphicQualityEnum('auto', '자동')
    static readonly HIGH = new GraphicQualityEnum('high', '높음')
    static readonly MEDIUM = new GraphicQualityEnum('medium', '중간')
    static readonly LOW = new GraphicQualityEnum('low', '낮음')

    private constructor(key: GraphicQualityKey, label: string) {
        super(key, label)
    }

    get isAuto(): boolean {
        return this.key === 'auto'
    }

    static from(key: string): GraphicQualityEnum {
        return (
            EnumBase.fromKey<GraphicQualityEnum>(GraphicQualityEnum, key) ?? GraphicQualityEnum.AUTO
        )
    }
}
