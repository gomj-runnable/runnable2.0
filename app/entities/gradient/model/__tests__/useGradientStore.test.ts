import { describe, it, expect } from 'vitest'
import { useGradientStore } from '../useGradientStore'

describe('useGradientStore', () => {
    it('초기값', () => {
        const s = useGradientStore()
        expect(s.isGradientVisible.value).toBe(false)
        expect(s.currentDifficulty.value).toBeNull()
        expect(s.gradientSegments.value).toEqual([])
    })

    it('toggleGradient / showGradient / hideGradient', () => {
        const s = useGradientStore()
        s.toggleGradient()
        expect(s.isGradientVisible.value).toBe(true)
        s.hideGradient()
        expect(s.isGradientVisible.value).toBe(false)
        s.showGradient()
        expect(s.isGradientVisible.value).toBe(true)
    })

    it('setDifficulty / setSegments', () => {
        const s = useGradientStore()
        s.setDifficulty('hard' as any)
        expect(s.currentDifficulty.value).toBe('hard')

        const segments = [{ startIndex: 0, endIndex: 10, level: 'medium' } as any]
        s.setSegments(segments)
        expect(s.gradientSegments.value).toEqual(segments)
    })

    it('resetGradient 는 모든 상태 초기화', () => {
        const s = useGradientStore()
        s.showGradient()
        s.setDifficulty('easy' as any)
        s.setSegments([{ a: 1 } as any])

        s.resetGradient()

        expect(s.isGradientVisible.value).toBe(false)
        expect(s.currentDifficulty.value).toBeNull()
        expect(s.gradientSegments.value).toEqual([])
    })
})
