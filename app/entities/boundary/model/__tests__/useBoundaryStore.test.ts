import { describe, it, expect } from 'vitest'
import { useBoundaryStore } from '../useBoundaryStore'

describe('useBoundaryStore', () => {
    it('초기값: 두 토글 다 false', () => {
        const s = useBoundaryStore()
        expect(s.isGuActive.value).toBe(false)
        expect(s.isDongActive.value).toBe(false)
    })

    it('toggleGu / toggleDong 은 독립적으로 토글', () => {
        const s = useBoundaryStore()
        s.toggleGu()
        expect(s.isGuActive.value).toBe(true)
        expect(s.isDongActive.value).toBe(false)
        s.toggleDong()
        expect(s.isDongActive.value).toBe(true)
        s.toggleGu()
        expect(s.isGuActive.value).toBe(false)
    })
})
