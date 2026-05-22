import { describe, it, expect } from 'vitest'
import { useElevationLayerStore } from '../useElevationLayerStore'

describe('useElevationLayerStore', () => {
    it('초기값 false, toggle/show/hide', () => {
        const s = useElevationLayerStore()
        expect(s.isElevationVisible.value).toBe(false)

        s.toggleElevation()
        expect(s.isElevationVisible.value).toBe(true)

        s.hideElevation()
        expect(s.isElevationVisible.value).toBe(false)

        s.showElevation()
        expect(s.isElevationVisible.value).toBe(true)
    })
})
