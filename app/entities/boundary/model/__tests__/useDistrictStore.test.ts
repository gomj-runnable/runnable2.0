import { describe, it, expect } from 'vitest'
import { useDistrictStore } from '../useDistrictStore'

describe('useDistrictStore', () => {
    it('초기값 null + 빈 computed 결과', () => {
        const s = useDistrictStore()
        expect(s.data.value).toBeNull()
        expect(s.guList.value).toEqual([])
        expect(s.guNames.value).toEqual([])
        expect(s.dongMap.value).toEqual({})
        expect(s.getDongList('any')).toEqual([])
    })

    it('data 가 채워지면 guList/guNames/dongMap/getDongList 가 반영', () => {
        const s = useDistrictStore()
        s.data.value = {
            gu: [
                { name: '강남구', code: '11680', nx: 1, ny: 1 } as any,
                { name: '종로구', code: '11110', nx: 2, ny: 2 } as any
            ],
            dongMap: { 강남구: ['역삼동', '신사동'], 종로구: ['청운동'] }
        }

        expect(s.guNames.value).toEqual(['강남구', '종로구'])
        expect(s.getDongList('강남구')).toEqual(['역삼동', '신사동'])
        expect(s.getDongList('없는구')).toEqual([])

        const map = s.guByName.value
        expect(map.get('강남구')?.code).toBe('11680')
    })
})
