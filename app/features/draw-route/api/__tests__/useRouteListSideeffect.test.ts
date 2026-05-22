import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef } from 'vue'
import type { Ref, ShallowRef } from 'vue'

import { useRouteListSideeffect } from '~/features/draw-route/api/useRouteListSideeffect'

const C = {
    Color: {
        fromCssColorString: (s: string) => ({ withAlpha: (a: number) => ({ css: s, alpha: a }) })
    },
    Cartesian3: { fromDegrees: vi.fn() },
    HeightReference: { CLAMP_TO_GROUND: 1 }
}
vi.stubGlobal('window', { Cesium: C } as any)

const $fetchMock = vi.fn()
vi.stubGlobal('$fetch', $fetchMock)

const makeViewer = () => {
    const entities: any[] = []
    return {
        entities: {
            add: (opts: any) => {
                const e = { ...opts, show: true }
                entities.push(e)
                return e
            },
            remove: (e: any) => {
                const i = entities.indexOf(e)
                if (i >= 0) entities.splice(i, 1)
            },
            list: entities
        }
    }
}

describe('useRouteListSideeffect', () => {
    let viewer: ShallowRef<any>
    let routes: Ref<any[]>
    let selectedRouteId: Ref<string | null>
    let drawnPositions: Ref<any>

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        routes = ref([])
        selectedRouteId = ref<string | null>(null)
        drawnPositions = ref(null)
        $fetchMock.mockReset()
    })

    const create = () =>
        useRouteListSideeffect({
            viewer: viewer as any,
            routes,
            selectedRouteId,
            drawnPositions
        })

    it('fetchRoutes — $fetch 결과를 routes 에 반영', async () => {
        $fetchMock.mockResolvedValue([{ routeId: 'r1', title: 'A' }])
        const sideeffect = create()
        await sideeffect.fetchRoutes()
        expect(routes.value).toHaveLength(1)
        expect($fetchMock).toHaveBeenCalledWith('/api/routes')
    })

    it('fetchRouteSections — $fetch 결과 반환', async () => {
        $fetchMock.mockResolvedValue([{ sectionId: 's1' }])
        const sideeffect = create()
        const result = await sideeffect.fetchRouteSections('r1')
        expect(result).toEqual([{ sectionId: 's1' }])
        expect($fetchMock).toHaveBeenCalledWith('/api/routes/r1/sections')
    })

    it('selectRoute — 새 routeId 선택 + sections 가져와 entity 추가', async () => {
        $fetchMock.mockResolvedValue([
            {
                sectionId: 's1',
                geom: {
                    type: 'LineString',
                    coordinates: [
                        [127, 37, 0],
                        [127.001, 37.001, 5]
                    ]
                }
            }
        ])
        const sideeffect = create()
        const result = await sideeffect.selectRoute('r1')
        expect(result).toHaveLength(1)
        expect(selectedRouteId.value).toBe('r1')
        expect(drawnPositions.value).toHaveLength(2)
        expect((viewer.value.entities as any).list.length).toBeGreaterThan(0)
    })

    it('selectRoute — 같은 routeId 재선택 시 해제 + null 반환', async () => {
        selectedRouteId.value = 'r1'
        const sideeffect = create()
        const result = await sideeffect.selectRoute('r1')
        expect(result).toBeNull()
        expect(selectedRouteId.value).toBeNull()
        expect(drawnPositions.value).toBeNull()
    })

    it('clearPreview — entity 모두 제거', async () => {
        $fetchMock.mockResolvedValue([
            {
                sectionId: 's1',
                geom: {
                    type: 'LineString',
                    coordinates: [
                        [127, 37, 0],
                        [127.001, 37.001, 5]
                    ]
                }
            }
        ])
        const sideeffect = create()
        await sideeffect.selectRoute('r1')
        const initial = (viewer.value.entities as any).list.length
        expect(initial).toBeGreaterThan(0)

        sideeffect.clearPreview()
        expect((viewer.value.entities as any).list).toHaveLength(0)
    })

    it('selectRoute — 좌표 2개 미만 sections 는 drawnPositions 가 null', async () => {
        $fetchMock.mockResolvedValue([
            {
                sectionId: 's1',
                geom: { type: 'LineString', coordinates: [[127, 37, 0]] }
            }
        ])
        const sideeffect = create()
        await sideeffect.selectRoute('r1')
        expect(drawnPositions.value).toBeNull()
    })

    it('selectRoute — viewer 가 null 이면 entity 추가 없이 sections 반환', async () => {
        viewer.value = null
        $fetchMock.mockResolvedValue([
            {
                sectionId: 's1',
                geom: {
                    type: 'LineString',
                    coordinates: [
                        [127, 37, 0],
                        [127.001, 37.001, 5]
                    ]
                }
            }
        ])
        const sideeffect = create()
        const result = await sideeffect.selectRoute('r1')
        expect(result).not.toBeNull()
        expect(selectedRouteId.value).toBe('r1')
    })

    it('hidePreviewPolylines / showPreviewPolylines — entity.show 토글', async () => {
        $fetchMock.mockResolvedValue([
            {
                sectionId: 's1',
                geom: {
                    type: 'LineString',
                    coordinates: [
                        [127, 37, 0],
                        [127.001, 37.001, 5]
                    ]
                }
            }
        ])
        const sideeffect = create()
        await sideeffect.selectRoute('r1')
        sideeffect.hidePreviewPolylines()
        const polylineEntities = (viewer.value.entities as any).list.filter((e: any) => e.polyline)
        for (const e of polylineEntities) {
            expect(e.show).toBe(false)
        }
        sideeffect.showPreviewPolylines()
        for (const e of polylineEntities) {
            expect(e.show).toBe(true)
        }
    })
})
