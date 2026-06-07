import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef, watch as vueWatch } from 'vue'

import { useRouteInfoSideeffect } from '~/features/route-info/api/useRouteInfoSideeffect'

vi.stubGlobal('watch', vueWatch)

const sharedStore = vi.hoisted(() => ({ store: null as any }))
vi.mock('~/entities/route/model/useRouteInfoStore', () => ({
    useRouteInfoStore: () => sharedStore.store
}))

const $fetchMock = vi.fn()
vi.stubGlobal('$fetch', $fetchMock)

const C: any = {
    ScreenSpaceEventHandler: function (this: any) {
        this.setInputAction = vi.fn()
        this.destroy = vi.fn()
    } as any,
    ScreenSpaceEventType: { LEFT_CLICK: 1 },
    Cartesian3: { fromDegrees: (lng: number, lat: number, h?: number) => ({ lng, lat, h }) },
    Cartesian2: function (this: any, x: number, y: number) {
        this.x = x
        this.y = y
    } as any,
    Color: Object.assign(
        function (this: any, r: number, g: number, b: number, a: number) {
            this.r = r
            this.g = g
            this.b = b
            this.a = a
        } as any,
        { YELLOW: 'y', BLACK: 'b', WHITE: 'w' }
    ),
    Math: { toDegrees: (rad: number) => (rad * 180) / Math.PI },
    Cartographic: {
        fromCartesian: (c: any) => ({
            longitude: c.lng ?? 0,
            latitude: c.lat ?? 0,
            height: c.h ?? 0
        })
    },
    defined: (val: any) => val !== null && val !== undefined,
    HeightReference: { CLAMP_TO_GROUND: 1 },
    LabelStyle: { FILL_AND_OUTLINE: 1 },
    VerticalOrigin: { BOTTOM: 1 }
}
vi.stubGlobal('window', { Cesium: C } as any)

const makeViewer = () => {
    const added: any[] = []
    return {
        entities: {
            add: (opts: any) => {
                const e = { ...opts }
                added.push(e)
                return e
            },
            remove: (e: any) => {
                const i = added.indexOf(e)
                if (i >= 0) added.splice(i, 1)
            },
            list: added
        },
        scene: {
            canvas: {},
            pick: vi.fn(() => null),
            pickPositionSupported: true,
            pickPosition: vi.fn(),
            globe: { pick: vi.fn() }
        },
        camera: {
            getPickRay: vi.fn()
        }
    }
}

describe('useRouteInfoSideeffect', () => {
    let viewer: ReturnType<typeof shallowRef<any>>

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        sharedStore.store = {
            routeInfos: ref<any[]>([]),
            localRouteInfos: ref<any[]>([]),
            isAddingRouteInfo: ref(false),
            selectedMarkerRouteInfo: ref<any>(null),
            isLoading: ref(false),
            clearLocalRouteInfos: vi.fn(),
            clearRouteInfos: vi.fn()
        }
        $fetchMock.mockReset()
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    describe('fetchRouteInfos', () => {
        it('성공 — store.routeInfos 갱신', async () => {
            $fetchMock.mockResolvedValue([
                { name: 'info1', geom: { type: 'Point', coordinates: [127, 37] } }
            ])
            const sideeffect = useRouteInfoSideeffect(viewer as any)
            await sideeffect.fetchRouteInfos('r-1')
            expect($fetchMock).toHaveBeenCalledWith('/api/routes/r-1/feedbacks')
            expect(sharedStore.store.routeInfos.value).toHaveLength(1)
            expect(sharedStore.store.isLoading.value).toBe(false)
        })

        it('실패 시 console.error + 데이터 변경 없음', async () => {
            $fetchMock.mockRejectedValue(new Error('boom'))
            const sideeffect = useRouteInfoSideeffect(viewer as any)
            await sideeffect.fetchRouteInfos('r-1')
            expect(sharedStore.store.routeInfos.value).toEqual([])
            expect(sharedStore.store.isLoading.value).toBe(false)
        })
    })

    describe('submitRouteInfo', () => {
        it('성공 — routeInfos 추가 + isAddingRouteInfo=false', async () => {
            $fetchMock.mockResolvedValue({
                name: 'new',
                geom: { type: 'Point', coordinates: [127, 37] }
            })
            sharedStore.store.isAddingRouteInfo.value = true
            const sideeffect = useRouteInfoSideeffect(viewer as any)
            await sideeffect.submitRouteInfo('r-1', { name: 'new' } as any)
            expect(sharedStore.store.routeInfos.value).toHaveLength(1)
            expect(sharedStore.store.isAddingRouteInfo.value).toBe(false)
        })

        it('실패 → throw', async () => {
            $fetchMock.mockRejectedValue(new Error('boom'))
            const sideeffect = useRouteInfoSideeffect(viewer as any)
            await expect(sideeffect.submitRouteInfo('r-1', {} as any)).rejects.toThrow('boom')
        })
    })

    describe('saveLocalRouteInfos', () => {
        it('localRouteInfos 비어 있으면 무동작', async () => {
            const sideeffect = useRouteInfoSideeffect(viewer as any)
            await sideeffect.saveLocalRouteInfos('r-1')
            expect($fetchMock).not.toHaveBeenCalled()
        })

        it('각 local 항목에 대해 POST 후 clearLocalRouteInfos', async () => {
            sharedStore.store.localRouteInfos.value = [
                { name: 'a', geom: { type: 'Point', coordinates: [127, 37] } },
                { name: 'b', geom: { type: 'Point', coordinates: [127, 37] } }
            ] as any
            $fetchMock.mockResolvedValue({
                name: 'saved',
                geom: { type: 'Point', coordinates: [127, 37] }
            })
            const sideeffect = useRouteInfoSideeffect(viewer as any)
            await sideeffect.saveLocalRouteInfos('r-1')
            expect($fetchMock).toHaveBeenCalledTimes(2)
            expect(sharedStore.store.clearLocalRouteInfos).toHaveBeenCalled()
        })

        it('일부 실패해도 다음 항목 진행', async () => {
            sharedStore.store.localRouteInfos.value = [
                { name: 'a', geom: { type: 'Point', coordinates: [127, 37] } },
                { name: 'b', geom: { type: 'Point', coordinates: [127, 37] } }
            ] as any
            $fetchMock.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({
                name: 'b',
                geom: { type: 'Point', coordinates: [127, 37] }
            })
            const sideeffect = useRouteInfoSideeffect(viewer as any)
            await sideeffect.saveLocalRouteInfos('r-1')
            expect(sharedStore.store.routeInfos.value).toHaveLength(1)
            expect(sharedStore.store.clearLocalRouteInfos).toHaveBeenCalled()
        })
    })

    describe('renderRouteInfoMarkers / clearMarkers', () => {
        it('routeInfos + localRouteInfos 모두 entity 로 렌더링', () => {
            sharedStore.store.routeInfos.value = [
                { name: '서버', geom: { type: 'Point', coordinates: [127, 37, 50] } }
            ] as any
            sharedStore.store.localRouteInfos.value = [
                { name: '로컬', geom: { type: 'Point', coordinates: [127.001, 37.001] } }
            ] as any
            const sideeffect = useRouteInfoSideeffect(viewer as any)
            sideeffect.renderRouteInfoMarkers()
            expect(viewer.value.entities.list.length).toBe(2)
        })

        it('viewer null 이면 entity 추가 안 함', () => {
            viewer.value = null
            sharedStore.store.routeInfos.value = [
                { name: 'x', geom: { type: 'Point', coordinates: [127, 37] } }
            ] as any
            const sideeffect = useRouteInfoSideeffect(viewer as any)
            sideeffect.renderRouteInfoMarkers()
            // throw 없음
        })

        it('clearMarkers — entity 모두 제거', () => {
            sharedStore.store.routeInfos.value = [
                { name: 'x', geom: { type: 'Point', coordinates: [127, 37] } }
            ] as any
            const sideeffect = useRouteInfoSideeffect(viewer as any)
            sideeffect.renderRouteInfoMarkers()
            expect(viewer.value.entities.list.length).toBe(1)
            sideeffect.clearMarkers()
            expect(viewer.value.entities.list).toHaveLength(0)
        })
    })

    describe('cancelAdding', () => {
        it('isAddingRouteInfo=false + clickedPosition=null', () => {
            sharedStore.store.isAddingRouteInfo.value = true
            const sideeffect = useRouteInfoSideeffect(viewer as any)
            sideeffect.cancelAdding()
            expect(sharedStore.store.isAddingRouteInfo.value).toBe(false)
            expect(sideeffect.clickedPosition.value).toBeNull()
        })
    })
})
