import { describe, it, expect } from 'vitest'
import { useFacilityStore } from '../useFacilityStore'

describe('useFacilityStore', () => {
    it('초기값', () => {
        const s = useFacilityStore()
        expect(s.facilities.value).toEqual([])
        expect(s.activeTypes.value.size).toBe(0)
        expect(s.isLoading.value).toBe(false)
        expect(s.isSearching.value).toBe(false)
        expect(s.selectedFacility.value).toBeNull()
    })

    it('toggleType: 추가 → 제거', () => {
        const s = useFacilityStore()

        s.toggleType('toilet' as any)
        expect(s.isTypeActive('toilet' as any)).toBe(true)

        s.toggleType('toilet' as any)
        expect(s.isTypeActive('toilet' as any)).toBe(false)
    })

    it('facilitiesByType 은 type 별 필터링', () => {
        const s = useFacilityStore()
        s.facilities.value = [
            { id: '1', type: 'toilet' } as any,
            { id: '2', type: 'fountain' } as any,
            { id: '3', type: 'toilet' } as any
        ]
        expect(s.facilitiesByType('toilet' as any)).toHaveLength(2)
        expect(s.facilitiesByType('fountain' as any)).toHaveLength(1)
    })
})
