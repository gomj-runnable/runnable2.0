import { describe, it, expect } from 'vitest'
import { ScreenModeEnum } from '#shared/types/screen-mode.enum'
import { useViewModeStore } from '../useViewModeStore'

describe('useViewModeStore', () => {
    it('초기값 — 3D 모드, 전환 중 아님', () => {
        const s = useViewModeStore()
        expect(s.screenMode.value.key).toBe(ScreenModeEnum.MODE3D.key)
        expect(s.is3D.value).toBe(true)
        expect(s.is2D.value).toBe(false)
        expect(s.isTransitioning.value).toBe(false)
    })

    it('toggle — 3D ↔ 2D 전환', () => {
        const s = useViewModeStore()
        s.toggle()
        expect(s.is2D.value).toBe(true)
        s.toggle()
        expect(s.is3D.value).toBe(true)
    })

    it('toggle — 전환 중이면 무시', () => {
        const s = useViewModeStore()
        s.setTransitioning(true)
        s.toggle()
        expect(s.is3D.value).toBe(true)
    })

    it('setMode — 명시적 모드 설정', () => {
        const s = useViewModeStore()
        s.setMode(ScreenModeEnum.MODE2D)
        expect(s.screenMode.value.key).toBe(ScreenModeEnum.MODE2D.key)
    })
})
