import { GraphicQualityEnum } from '#shared/types/graphic-quality.enum'

/**
 * 그래픽 품질 설정 상태를 관리하는 store composable.
 * 사용자가 선택한 품질 레벨과 자동 모드가 실제 적용 중인 레벨을 보관한다.
 * 실제 Cesium 렌더링 옵션 적용은 `useGraphicQualitySideeffect`에 위임한다.
 */
export const useGraphicQualityStore = () => {
    /** 사용자가 선택한 품질 레벨 (자동/높음/중간/낮음) */
    const level = useState<GraphicQualityEnum>(
        'graphicQuality.level',
        () => GraphicQualityEnum.AUTO
    )

    /** 실제 적용 중인 고정 레벨. 자동 모드에선 FPS에 따라 바뀌고, 고정 모드에선 level과 동일하다. */
    const appliedLevel = useState<GraphicQualityEnum>(
        'graphicQuality.appliedLevel',
        () => GraphicQualityEnum.HIGH
    )

    /** 자동 모드 여부 */
    const isAuto = computed(() => level.value.isAuto)

    /** 품질 레벨을 변경한다. */
    const setLevel = (next: GraphicQualityEnum) => {
        level.value = next
    }

    /** 실제 적용 레벨을 갱신한다. (sideeffect 전용) */
    const setAppliedLevel = (next: GraphicQualityEnum) => {
        appliedLevel.value = next
    }

    return {
        level,
        appliedLevel,
        isAuto,
        setLevel,
        setAppliedLevel
    }
}
