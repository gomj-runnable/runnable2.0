import { describe, it, expect } from 'vitest'
import { useRouteInfoStore } from '../useRouteInfoStore'

describe('useRouteInfoStore', () => {
    it('초기값', () => {
        const s = useRouteInfoStore()
        expect(s.routeInfos.value).toEqual([])
        expect(s.draftRouteInfos.value).toEqual([])
        expect(s.isAddingRouteInfo.value).toBe(false)
        expect(s.selectedMarkerRouteInfo.value).toBeNull()
        expect(s.isLoading.value).toBe(false)
    })

    it('toggleAddingMode: 켜고 끄기 + 끌 때 selectedMarker 도 비움', () => {
        const s = useRouteInfoStore()
        s.selectedMarkerRouteInfo.value = { name: 'foo' } as any

        s.toggleAddingMode()
        expect(s.isAddingRouteInfo.value).toBe(true)
        // 켤 때는 selectedMarker 유지
        expect(s.selectedMarkerRouteInfo.value).toEqual({ name: 'foo' })

        s.toggleAddingMode()
        expect(s.isAddingRouteInfo.value).toBe(false)
        expect(s.selectedMarkerRouteInfo.value).toBeNull()
    })

    it('addDraftRouteInfo / clearDraftRouteInfos', () => {
        const s = useRouteInfoStore()
        s.addDraftRouteInfo({ name: 'a' } as any)
        s.addDraftRouteInfo({ name: 'b' } as any)
        expect(s.draftRouteInfos.value).toHaveLength(2)

        s.clearDraftRouteInfos()
        expect(s.draftRouteInfos.value).toEqual([])
    })

    it('clearRouteInfos 는 모든 상태 초기화', () => {
        const s = useRouteInfoStore()
        s.routeInfos.value = [{ routeInfoId: 'ri-1' } as any]
        s.addDraftRouteInfo({ name: 'a' } as any)
        s.selectedMarkerRouteInfo.value = { name: 'm' } as any
        s.isAddingRouteInfo.value = true

        s.clearRouteInfos()

        expect(s.routeInfos.value).toEqual([])
        expect(s.draftRouteInfos.value).toEqual([])
        expect(s.selectedMarkerRouteInfo.value).toBeNull()
        expect(s.isAddingRouteInfo.value).toBe(false)
    })
})
