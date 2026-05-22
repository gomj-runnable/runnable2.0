import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef, nextTick, watchEffect as vueWatchEffect } from 'vue'

import { useRouteClosingSideeffect } from '~/features/draw-route/api/useRouteClosingSideeffect'
import { RouteClosingModeEnum } from '#shared/types/route-closing-mode.enum'

vi.stubGlobal('watchEffect', vueWatchEffect)

const C = {
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

describe('useRouteClosingSideeffect', () => {
    let viewer: ReturnType<typeof shallowRef<any>>
    let drawnPositions: ReturnType<typeof ref<any>>
    let closingMode: ReturnType<typeof ref<any>>

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        drawnPositions = ref(null)
        closingMode = ref(null)
    })

    const create = () =>
        useRouteClosingSideeffect({
            viewer: viewer as any,
            drawnPositions,
            closingMode
        })

    it('positions 가 null 이면 entity 추가 없음', async () => {
        create()
        await nextTick()
        expect((viewer.value.entities as any).list).toHaveLength(0)
    })

    it('loop-close 모드 — 1개 entity 추가 (마지막→첫 직선)', async () => {
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        closingMode.value = RouteClosingModeEnum.LOOP_CLOSE
        create()
        await nextTick()
        expect((viewer.value.entities as any).list).toHaveLength(1)
    })

    it('round-trip 모드 — 외곽 + 점선 2개 entity 추가', async () => {
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        closingMode.value = RouteClosingModeEnum.ROUND_TRIP
        create()
        await nextTick()
        expect((viewer.value.entities as any).list).toHaveLength(2)
    })

    it('mode null 이면 entity 추가 없음', async () => {
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        closingMode.value = null
        create()
        await nextTick()
        expect((viewer.value.entities as any).list).toHaveLength(0)
    })

    it('mode 변경 시 기존 preview 제거 후 새로 그림', async () => {
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        closingMode.value = RouteClosingModeEnum.LOOP_CLOSE
        create()
        await nextTick()
        expect((viewer.value.entities as any).list).toHaveLength(1)

        closingMode.value = RouteClosingModeEnum.ROUND_TRIP
        await nextTick()
        expect((viewer.value.entities as any).list).toHaveLength(2)
    })

    it('clearClosingPreview — 수동 제거', async () => {
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        closingMode.value = RouteClosingModeEnum.LOOP_CLOSE
        const sideeffect = create()
        await nextTick()
        sideeffect.clearClosingPreview()
        expect((viewer.value.entities as any).list).toHaveLength(0)
    })

    it('viewer 가 null 이면 entity 추가 안 함', async () => {
        viewer.value = null
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        closingMode.value = RouteClosingModeEnum.LOOP_CLOSE
        create()
        await nextTick()
        // viewer 가 null 이면 entity 추가 자체가 안 됨
    })
})
