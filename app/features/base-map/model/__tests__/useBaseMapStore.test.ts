import { describe, it, expect } from 'vitest'
import { BaseMapEnum } from '#shared/types/base-map.enum'
import { useBaseMapStore } from '../useBaseMapStore'

describe('useBaseMapStore', () => {
    it('초기값 — 위성영상', () => {
        const s = useBaseMapStore()
        expect(s.kind.value.key).toBe(BaseMapEnum.SATELLITE.key)
        expect(s.isSatellite.value).toBe(true)
    })

    it('toggle — 위성 ↔ 기본지도 전환', () => {
        const s = useBaseMapStore()
        s.toggle()
        expect(s.kind.value.key).toBe(BaseMapEnum.BASE.key)
        s.toggle()
        expect(s.kind.value.key).toBe(BaseMapEnum.SATELLITE.key)
    })

    it('setKind — 명시적 설정', () => {
        const s = useBaseMapStore()
        s.setKind(BaseMapEnum.BASE)
        expect(s.kind.value.key).toBe(BaseMapEnum.BASE.key)
        expect(s.isSatellite.value).toBe(false)
    })
})
