import { describe, it, expect } from 'vitest'
import { getRouteInfoItems } from '~/shared/lib/useRouteInfoFormat'

// ─── getRouteInfoItems ─────────────────────────────────────────────────────
describe('getRouteInfoItems', () => {
    it('모든 필드가 있으면 4개 항목을 반환한다', () => {
        const items = getRouteInfoItems({
            distance: 5200,
            highHeight: 345.7,
            lowHeight: 12.3,
            sgg: ['강남구', '서초구']
        })

        expect(items).toHaveLength(4)
        expect(items[0]!.key).toBe('거리')
        expect(items[1]!.key).toBe('최고 고도')
        expect(items[2]!.key).toBe('최저 고도')
        expect(items[3]!.key).toBe('지역')
    })

    it('빈 객체이면 빈 배열을 반환한다', () => {
        const items = getRouteInfoItems({})
        expect(items).toHaveLength(0)
    })

    it('distance만 있으면 거리 항목만 반환한다', () => {
        const items = getRouteInfoItems({ distance: 3000 })
        expect(items).toHaveLength(1)
        expect(items[0]!.key).toBe('거리')
    })

    it('고도 값은 정수로 반올림된다', () => {
        const items = getRouteInfoItems({ highHeight: 123.7 })
        expect(items[0]!.value).toBe('124m')
    })

    it('sgg 배열은 " · "로 조인된다', () => {
        const items = getRouteInfoItems({ sgg: ['강남구', '서초구', '송파구'] })
        expect(items[0]!.value).toBe('강남구 · 서초구 · 송파구')
    })

    it('sgg 배열이 비어있으면 지역 항목이 생성되지 않는다', () => {
        const items = getRouteInfoItems({ sgg: [] })
        expect(items).toHaveLength(0)
    })

    it('distance가 0이면 거리 항목이 생성되지 않는다 (falsy)', () => {
        const items = getRouteInfoItems({ distance: 0 })
        expect(items).toHaveLength(0)
    })
})
