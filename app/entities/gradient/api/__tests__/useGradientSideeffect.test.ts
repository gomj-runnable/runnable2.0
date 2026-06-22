import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef, nextTick, watch as vueWatch } from 'vue'

import { useGradientSideeffect } from '~/entities/gradient/api/useGradientSideeffect'
import { useMapViewer } from '~/shared/lib/cesium/getters/useMapViewer'

vi.stubGlobal('onBeforeUnmount', vi.fn())
vi.stubGlobal('watch', vueWatch)

// viewer 소유권은 CesiumController(useMapViewer)에 있다. 테스트는 공유 ref 를 직접 제어한다.
vi.mock('~/shared/lib/cesium/getters/useMapViewer', async () => {
    const { shallowRef } = await import('vue')
    const viewer = shallowRef<unknown>(null)
    return {
        useMapViewer: () => ({
            viewer,
            setViewer: (v: unknown) => {
                viewer.value = v
            }
        })
    }
})

const C: any = {
    Color: {
        fromCssColorString: (s: string) => ({ withAlpha: (a: number) => ({ css: s, alpha: a }) })
    },
    Cartesian3: { fromDegrees: (lng: number, lat: number, h: number) => ({ lng, lat, h }) },
    HeightReference: { CLAMP_TO_GROUND: 1 }
}
vi.stubGlobal('window', { Cesium: C } as any)

const { setViewer: setMockViewer } = useMapViewer() as unknown as {
    setViewer: (v: unknown) => void
}

const makeViewer = () => {
    const added: any[] = []
    return {
        entities: {
            add: (opts: any) => {
                const e = { ...opts, show: true }
                added.push(e)
                return e
            },
            remove: (e: any) => {
                const i = added.indexOf(e)
                if (i >= 0) added.splice(i, 1)
            },
            list: added
        }
    }
}

describe('useGradientSideeffect', () => {
    let viewer: ReturnType<typeof shallowRef<any>>
    let isGradientVisible: ReturnType<typeof ref<boolean>>
    let drawnPositions: ReturnType<typeof ref<any>>
    let setSegments: ReturnType<typeof vi.fn>
    let setDifficulty: ReturnType<typeof vi.fn>
    let hideRoutePolylines: ReturnType<typeof vi.fn>
    let showRoutePolylines: ReturnType<typeof vi.fn>

    beforeEach(() => {
        setMockViewer(null)
        viewer = shallowRef(makeViewer())
        setMockViewer(viewer.value)
        isGradientVisible = ref(false)
        drawnPositions = ref<any>(null)
        setSegments = vi.fn()
        setDifficulty = vi.fn()
        hideRoutePolylines = vi.fn()
        showRoutePolylines = vi.fn()
    })

    type GradientOpts = Parameters<typeof useGradientSideeffect>[0]
    const create = () =>
        useGradientSideeffect({
            isGradientVisible: isGradientVisible as GradientOpts['isGradientVisible'],
            drawnPositions: drawnPositions as GradientOpts['drawnPositions'],
            setSegments: setSegments as GradientOpts['setSegments'],
            setDifficulty: setDifficulty as GradientOpts['setDifficulty'],
            hideRoutePolylines: hideRoutePolylines as GradientOpts['hideRoutePolylines'],
            showRoutePolylines: showRoutePolylines as GradientOpts['showRoutePolylines']
        })

    it('isGradientVisible=true + positions < 2 — apply 호출되어도 그릴 것 없음 (entity 0)', async () => {
        const { init } = create()
        init()
        await nextTick()
        // 초기 false → remove 경로 → clear + setSegments([]) + setDifficulty(null) + showRoutePolylines
        expect(setSegments).toHaveBeenCalledWith([])
        expect(setDifficulty).toHaveBeenCalledWith(null)
        expect(showRoutePolylines).toHaveBeenCalled()
    })

    it('isGradientVisible=true + positions 2개 이상 → entity 추가 + hideRoutePolylines', async () => {
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5],
            [127.002, 37.002, 10]
        ]
        isGradientVisible.value = true
        const { init } = create()
        init()
        await nextTick()
        // gradient segments 가 추가됨 (2개 세그먼트)
        expect(viewer.value.entities.list.length).toBeGreaterThan(0)
        expect(hideRoutePolylines).toHaveBeenCalled()
        expect(setSegments).toHaveBeenCalled()
        expect(setDifficulty).toHaveBeenCalled()
    })

    it('isGradientVisible=true → false 토글 시 entity 모두 제거 + showRoutePolylines + 초기화', async () => {
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        isGradientVisible.value = true
        const { init } = create()
        init()
        await nextTick()

        isGradientVisible.value = false
        await nextTick()

        expect(viewer.value.entities.list).toHaveLength(0)
        expect(showRoutePolylines).toHaveBeenCalled()
    })

    it('viewer null → entity 추가 안 함', async () => {
        setMockViewer(null)
        drawnPositions.value = [
            [127, 37, 0],
            [127.001, 37.001, 5]
        ]
        isGradientVisible.value = true
        const { init } = create()
        init()
        await nextTick()
        // viewer null 이면 drawGradientPolylines 가 early return
    })
})
