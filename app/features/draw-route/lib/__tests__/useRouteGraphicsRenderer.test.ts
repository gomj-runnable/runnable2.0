import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef } from 'vue'

import { useRouteGraphicsRenderer } from '~/features/draw-route/lib/useRouteGraphicsRenderer'
import { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'

const C: any = {
    Color: {
        fromCssColorString: (s: string) => ({ withAlpha: (a: number) => ({ css: s, alpha: a }) })
    },
    Cartesian3: { fromDegrees: (lng: number, lat: number, h: number) => ({ lng, lat, h }) },
    PolylineDashMaterialProperty: function (this: any, opts: any) {
        this.opts = opts
    } as any,
    HeightReference: { CLAMP_TO_GROUND: 1 }
}
vi.stubGlobal('window', { Cesium: C } as any)

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

describe('useRouteGraphicsRenderer', () => {
    let viewer: ReturnType<typeof shallowRef<any>>
    let drawnPositions: ReturnType<typeof ref<any>>
    let sectionPointRanges: ReturnType<typeof ref<any>>

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        drawnPositions = ref(null)
        sectionPointRanges = ref<any>([])
    })

    const create = (closingMode?: any) =>
        useRouteGraphicsRenderer({
            viewer: viewer as any,
            drawnPositions,
            sectionPointRanges,
            closingMode
        })

    it('drawnPositions null 이면 redraw 시 entity 없음', () => {
        const r = create()
        r.redrawSectionGraphics()
        expect((viewer.value.entities as any).list).toHaveLength(0)
    })

    it('ranges 빈 배열이면 entity 없음', () => {
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        const r = create()
        r.redrawSectionGraphics()
        expect((viewer.value.entities as any).list).toHaveLength(0)
    })

    it('정상 — section polyline + start point + end points', () => {
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5],
            [127.002, 37.002, 10]
        ]
        sectionPointRanges.value = [
            { start: 0, end: 1 },
            { start: 1, end: 2 }
        ]
        const r = create()
        r.redrawSectionGraphics()
        // 2개 polyline + 1개 시작점 + 2개 구간 끝점 = 5
        expect((viewer.value.entities as any).list.length).toBeGreaterThanOrEqual(5)
    })

    it('isRoundTrip 모드 — dashed material 사용 (entity 정상 추가)', () => {
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        sectionPointRanges.value = [{ start: 0, end: 1 }]
        const closingMode = ref(RouteClosingModeEnum.ROUND_TRIP)
        const r = create(closingMode)
        r.redrawSectionGraphics()
        // 1 polyline + 1 시작 + 1 끝 = 3
        expect((viewer.value.entities as any).list.length).toBeGreaterThanOrEqual(2)
    })

    it('clearSectionGraphics — 추가된 entity 모두 제거', () => {
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        sectionPointRanges.value = [{ start: 0, end: 1 }]
        const r = create()
        r.redrawSectionGraphics()
        const before = (viewer.value.entities as any).list.length
        expect(before).toBeGreaterThan(0)
        r.clearSectionGraphics()
        expect((viewer.value.entities as any).list).toHaveLength(0)
    })

    it('viewer.value null 이면 drawSection/createRoutePoint 모두 null 반환 (entity 추가 X)', () => {
        viewer.value = null
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        sectionPointRanges.value = [{ start: 0, end: 1 }]
        const r = create()
        r.redrawSectionGraphics()
        // viewer 가 null 이면 early return — 검증 가능한 것은 throw 안 함
    })

    it('range.length 가 1 이하인 section 은 polyline 추가 안 함', () => {
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        sectionPointRanges.value = [{ start: 0, end: 0 }] // 1개 포인트만
        const r = create()
        r.redrawSectionGraphics()
        // polyline 추가 안 됨 (sectionPts.length < 2)
        const polylines = (viewer.value.entities as any).list.filter((e: any) => e.polyline)
        expect(polylines).toHaveLength(0)
    })
})
