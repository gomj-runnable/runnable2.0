import { describe, it, expect } from 'vitest'
import { useRouteClosingStore, RouteClosingModeEnum } from '../useRouteClosingStore'

describe('useRouteClosingStore', () => {
    it('초기값: null, isLoopClose/isRoundTrip 둘 다 false', () => {
        const s = useRouteClosingStore()
        expect(s.closingMode.value).toBeNull()
        expect(s.isLoopClose.value).toBe(false)
        expect(s.isRoundTrip.value).toBe(false)
    })

    it('setClosingMode(LOOP_CLOSE) → loop-close 활성', () => {
        const s = useRouteClosingStore()
        s.setClosingMode(RouteClosingModeEnum.LOOP_CLOSE)
        expect(s.isLoopClose.value).toBe(true)
        expect(s.isRoundTrip.value).toBe(false)
    })

    it('동일 모드 재설정 → 토글 (null 로)', () => {
        const s = useRouteClosingStore()
        s.setClosingMode(RouteClosingModeEnum.LOOP_CLOSE)
        s.setClosingMode(RouteClosingModeEnum.LOOP_CLOSE)
        expect(s.closingMode.value).toBeNull()
    })

    it('다른 모드 설정 → 전환', () => {
        const s = useRouteClosingStore()
        s.setClosingMode(RouteClosingModeEnum.LOOP_CLOSE)
        s.setClosingMode(RouteClosingModeEnum.ROUND_TRIP)
        expect(s.isRoundTrip.value).toBe(true)
        expect(s.isLoopClose.value).toBe(false)
    })

    it('setClosingMode(null) 으로 명시적 null 설정 가능', () => {
        const s = useRouteClosingStore()
        s.setClosingMode(RouteClosingModeEnum.LOOP_CLOSE)
        s.setClosingMode(null)
        expect(s.closingMode.value).toBeNull()
    })

    it('resetClosingMode 는 null 로', () => {
        const s = useRouteClosingStore()
        s.setClosingMode(RouteClosingModeEnum.ROUND_TRIP)
        s.resetClosingMode()
        expect(s.closingMode.value).toBeNull()
    })
})
