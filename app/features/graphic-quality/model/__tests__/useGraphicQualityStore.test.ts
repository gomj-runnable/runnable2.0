import { describe, it, expect } from 'vitest'
import { GraphicQualityEnum } from '#shared/types/graphic-quality.enum'
import { useGraphicQualityStore } from '../useGraphicQualityStore'

describe('useGraphicQualityStore', () => {
    it('초기값 — 레벨 auto, 적용 레벨 high', () => {
        const s = useGraphicQualityStore()
        expect(s.level.value.key).toBe(GraphicQualityEnum.AUTO.key)
        expect(s.isAuto.value).toBe(true)
        expect(s.appliedLevel.value.key).toBe(GraphicQualityEnum.HIGH.key)
    })

    it('setLevel — 고정 레벨 선택 시 isAuto false', () => {
        const s = useGraphicQualityStore()
        s.setLevel(GraphicQualityEnum.LOW)
        expect(s.level.value.key).toBe(GraphicQualityEnum.LOW.key)
        expect(s.isAuto.value).toBe(false)
    })

    it('setAppliedLevel — 자동 모드의 실제 적용 레벨 갱신', () => {
        const s = useGraphicQualityStore()
        s.setAppliedLevel(GraphicQualityEnum.MEDIUM)
        expect(s.appliedLevel.value.key).toBe(GraphicQualityEnum.MEDIUM.key)
        // 사용자가 선택한 레벨은 변하지 않는다
        expect(s.level.value.key).toBe(GraphicQualityEnum.AUTO.key)
    })
})
