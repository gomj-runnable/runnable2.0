import { describe, it, expect } from 'vitest'
import { useSidewalkStore } from '../useSidewalkStore'

const seed = (s: ReturnType<typeof useSidewalkStore>) => {
    s.districts.value = [
        { name: '강남구', code: '11680', count: 100, dongs: [{ name: '역삼동', count: 50 }] },
        { name: '종로구', code: '11110', count: 80, dongs: [] }
    ]
}

describe('useSidewalkStore', () => {
    it('초기값', () => {
        const s = useSidewalkStore()
        expect(s.districts.value).toEqual([])
        expect(s.selectedDistrict.value).toBeNull()
        expect(s.selectedDong.value).toBeNull()
        expect(s.isActive.value).toBe(false)
        expect(s.isLoading.value).toBe(false)
    })

    it('selectDistrict: 새 구 → 그 구 선택 + dong 초기화', () => {
        const s = useSidewalkStore()
        seed(s)
        s.selectedDong.value = '역삼동'
        s.selectDistrict('강남구')
        expect(s.selectedDistrict.value).toBe('강남구')
        expect(s.selectedDong.value).toBeNull()
    })

    it('selectDistrict: 동일 구 → 선택 해제', () => {
        const s = useSidewalkStore()
        s.selectedDistrict.value = '강남구'
        s.selectDistrict('강남구')
        expect(s.selectedDistrict.value).toBeNull()
    })

    it('setDistrictFromLocation: 라벨에서 구+동 매칭', () => {
        const s = useSidewalkStore()
        seed(s)
        s.setDistrictFromLocation('서울특별시 강남구 역삼동')
        expect(s.selectedDistrict.value).toBe('강남구')
        expect(s.selectedDong.value).toBe('역삼동')
    })

    it('setDistrictFromLocation: 동만 없으면 selectedDong = null', () => {
        const s = useSidewalkStore()
        seed(s)
        s.setDistrictFromLocation('서울특별시 강남구 청담동')
        expect(s.selectedDistrict.value).toBe('강남구')
        expect(s.selectedDong.value).toBeNull()
    })

    it('clearSelection / toggleActive', () => {
        const s = useSidewalkStore()
        s.selectedDistrict.value = '강남구'
        s.selectedDong.value = '역삼동'
        s.clearSelection()
        expect(s.selectedDistrict.value).toBeNull()
        expect(s.selectedDong.value).toBeNull()

        s.toggleActive()
        expect(s.isActive.value).toBe(true)
        s.toggleActive()
        expect(s.isActive.value).toBe(false)
    })
})
