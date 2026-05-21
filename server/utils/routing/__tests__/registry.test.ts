import { describe, it, expect } from 'vitest'
import { getRoutingService } from '../registry'
import { TMapRoutingService } from '../tmap.service'
import { OsrmRoutingService } from '../osrm.service'

describe('getRoutingService', () => {
    it('TMAP 모드는 TMapRoutingService 반환', () => {
        const svc = getRoutingService('TMAP' as any, { tmapApi: 'key' })
        expect(svc).toBeInstanceOf(TMapRoutingService)
        expect(svc?.isAvailable()).toBe(true)
    })

    it('OSRM 모드는 OsrmRoutingService 반환', () => {
        const svc = getRoutingService('OSRM' as any)
        expect(svc).toBeInstanceOf(OsrmRoutingService)
        expect(svc?.isAvailable()).toBe(true)
    })

    it('미등록 모드는 null', () => {
        expect(getRoutingService('UNKNOWN' as any)).toBeNull()
    })

    it('config 미전달 시 TMAP 은 apiKey 빈 문자열 → unavailable', () => {
        const svc = getRoutingService('TMAP' as any)
        expect(svc?.isAvailable()).toBe(false)
    })
})
