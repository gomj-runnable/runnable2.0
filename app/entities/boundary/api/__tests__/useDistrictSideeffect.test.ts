import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useDistrictSideeffect } from '~/entities/boundary/api/useDistrictSideeffect'

const sharedStore = vi.hoisted(() => ({
    data: { value: null as any },
    guGeojson: { value: null as any },
    dongGeojson: { value: null as any },
    guList: { value: [] },
    guNames: { value: [] },
    guByName: { value: new Map() },
    dongMap: { value: {} },
    getDongList: vi.fn()
}))
vi.mock('~/entities/boundary/model/useDistrictStore', () => ({
    useDistrictStore: () => sharedStore
}))

const $fetchMock = vi.fn()
vi.stubGlobal('$fetch', $fetchMock)

describe('useDistrictSideeffect', () => {
    beforeEach(() => {
        sharedStore.data.value = null
        sharedStore.guGeojson.value = null
        sharedStore.dongGeojson.value = null
        $fetchMock.mockReset()
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    describe('ensureLoaded', () => {
        it('이미 로드된 상태면 skip', async () => {
            sharedStore.data.value = { gu: [], dongMap: {} }
            const { ensureLoaded } = useDistrictSideeffect()
            await ensureLoaded()
            expect($fetchMock).not.toHaveBeenCalled()
        })

        it('미로드 상태에서 $fetch 호출', async () => {
            $fetchMock.mockResolvedValue({ gu: [{ name: '강남구' }], dongMap: {} })
            const { ensureLoaded } = useDistrictSideeffect()
            await ensureLoaded()
            expect($fetchMock).toHaveBeenCalledWith('/api/district')
            expect(sharedStore.data.value).toEqual({ gu: [{ name: '강남구' }], dongMap: {} })
        })

        it('실패 시 console.error + data 변경 없음', async () => {
            $fetchMock.mockRejectedValue(new Error('boom'))
            const { ensureLoaded } = useDistrictSideeffect()
            await ensureLoaded()
            expect(sharedStore.data.value).toBeNull()
        })
    })

    describe('ensureGuBoundaryLoaded', () => {
        it('이미 캐시 있으면 skip', async () => {
            sharedStore.guGeojson.value = { type: 'FeatureCollection', features: [] }
            const { ensureGuBoundaryLoaded } = useDistrictSideeffect()
            await ensureGuBoundaryLoaded()
            expect($fetchMock).not.toHaveBeenCalled()
        })

        it('$fetch 성공 시 캐시', async () => {
            const fc = { type: 'FeatureCollection', features: [] }
            $fetchMock.mockResolvedValue(fc)
            const { ensureGuBoundaryLoaded } = useDistrictSideeffect()
            await ensureGuBoundaryLoaded()
            expect(sharedStore.guGeojson.value).toBe(fc)
        })

        it('$fetch 실패 시 null 로 fallback', async () => {
            $fetchMock.mockRejectedValue(new Error('boom'))
            const { ensureGuBoundaryLoaded } = useDistrictSideeffect()
            await ensureGuBoundaryLoaded()
            expect(sharedStore.guGeojson.value).toBeNull()
        })
    })

    describe('ensureDongBoundaryLoaded', () => {
        it('성공 → 캐시', async () => {
            const fc = { type: 'FeatureCollection', features: [] }
            $fetchMock.mockResolvedValue(fc)
            const { ensureDongBoundaryLoaded } = useDistrictSideeffect()
            await ensureDongBoundaryLoaded()
            expect(sharedStore.dongGeojson.value).toBe(fc)
        })

        it('실패 → null', async () => {
            $fetchMock.mockRejectedValue(new Error('boom'))
            const { ensureDongBoundaryLoaded } = useDistrictSideeffect()
            await ensureDongBoundaryLoaded()
            expect(sharedStore.dongGeojson.value).toBeNull()
        })
    })

    describe('init', () => {
        it('세 fetch 를 Promise.all 로 병렬 호출', async () => {
            $fetchMock.mockResolvedValue({})
            const { init } = useDistrictSideeffect()
            await init()
            // 3번 호출 — meta + gu + dong
            expect($fetchMock).toHaveBeenCalledTimes(3)
        })
    })
})
