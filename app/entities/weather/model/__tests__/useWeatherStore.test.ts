import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useWeatherStore } from '~/entities/weather/model/useWeatherStore'

describe('useWeatherStore', () => {
    let store: ReturnType<typeof useWeatherStore>

    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-05-15T14:30:00'))
        store = useWeatherStore()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('selectedDate/Hour/Month 초기값 — 오늘 + 현재 시각', () => {
        expect(store.selectedDate.value).toBe('2026-05-15')
        expect(store.selectedHour.value).toBe('14:00')
        expect(store.selectedMonth.value).toBe('202605')
    })

    it('초기값 — monthlyData=null, isLoading=false, isVisible=true, activeLayer=null', () => {
        expect(store.monthlyData.value).toBeNull()
        expect(store.isLoading.value).toBe(false)
        expect(store.isVisible.value).toBe(true)
        expect(store.activeLayer.value).toBeNull()
    })

    it('selectedDate 변경 시 selectedMonth 자동 갱신', async () => {
        store.selectedDate.value = '2026-08-22'
        await nextTick()
        expect(store.selectedMonth.value).toBe('202608')
    })

    it('잘못된 형식의 selectedDate 는 selectedMonth 변경 안 함', async () => {
        store.selectedDate.value = 'invalid-date'
        await nextTick()
        expect(store.selectedMonth.value).toBe('202605')
    })

    it('dailySnapshot — monthlyData null 이면 빈 Map', () => {
        expect(store.dailySnapshot.value.size).toBe(0)
    })

    it('dailySnapshot — 선택된 date+hour 의 hourly 슬롯만 dongCode 키로 반환', async () => {
        store.monthlyData.value = {
            month: '202605',
            dongs: [
                {
                    dongCode: 'd1',
                    hourly: [
                        { date: '2026-05-15', time: '14:00', temperature: 20 } as any,
                        { date: '2026-05-15', time: '15:00', temperature: 22 } as any
                    ]
                },
                {
                    dongCode: 'd2',
                    hourly: [{ date: '2026-05-15', time: '14:00', temperature: 21 } as any]
                }
            ]
        } as any
        await nextTick()
        expect(store.dailySnapshot.value.size).toBe(2)
        expect(store.dailySnapshot.value.get('d1')!.temperature).toBe(20)
        expect(store.dailySnapshot.value.get('d2')!.temperature).toBe(21)
    })

    it('monthlyData 갱신 후 가용 시간에 selectedHour 가 없으면 첫 가용 시간으로 변경', async () => {
        store.selectedHour.value = '23:00'
        store.monthlyData.value = {
            month: '202605',
            dongs: [
                {
                    dongCode: 'd1',
                    hourly: [
                        { date: '2026-05-15', time: '08:00', temperature: 18 } as any,
                        { date: '2026-05-15', time: '09:00', temperature: 19 } as any
                    ]
                }
            ]
        } as any
        // watch 비동기 트리거 + flush
        await nextTick()
        await nextTick()
        expect(store.selectedHour.value).toBe('08:00')
    })

    it('가용 시간 0 일 때 selectedHour 변경 없음', async () => {
        const initialHour = store.selectedHour.value
        store.monthlyData.value = { month: '202605', dongs: [] } as any
        await nextTick()
        expect(store.selectedHour.value).toBe(initialHour)
    })
})
