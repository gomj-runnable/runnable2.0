import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shallowRef, nextTick, effectScope } from 'vue'
import type { ShallowRef } from 'vue'
import { ScreenModeEnum } from '#shared/types/screen-mode.enum'
import { useViewModeSideeffect } from '~/features/view-mode/api/useViewModeSideeffect'
import { useViewModeStore } from '~/features/view-mode/model/useViewModeStore'
import type { CesiumViewer } from '~/shared/lib/useWindow'

vi.mock('~/features/view-mode/model/useViewModeStore', async () => {
    const { ref, computed } = await import('vue')
    const { ScreenModeEnum: Mode } = await import('#shared/types/screen-mode.enum')
    const screenMode = ref(Mode.MODE3D)
    const isTransitioning = ref(false)
    const store = {
        screenMode,
        isTransitioning,
        is2D: computed(() => screenMode.value.is2D),
        is3D: computed(() => screenMode.value.is3D),
        setMode: (mode: unknown) => {
            screenMode.value = mode as never
        },
        setTransitioning: (value: boolean) => {
            isTransitioning.value = value
        }
    }
    return { useViewModeStore: () => store }
})

vi.mock('~/shared/lib/map/useCesiumRuntime', () => ({
    getCesiumRuntime: () => ({
        Math: { toRadians: (deg: number) => (deg * Math.PI) / 180 },
        Cartesian2: class {
            constructor(
                public x?: number,
                public y?: number
            ) {}
        },
        Cartesian3: {
            distance: () => 1234,
            clone: (c: unknown) => c
        },
        BoundingSphere: class {
            constructor(
                public center: unknown,
                public radius?: number
            ) {}
        },
        HeadingPitchRange: class {
            constructor(
                public heading?: number,
                public pitch?: number,
                public range?: number
            ) {}
        },
        defined: (value: unknown) => value !== undefined && value !== null
    })
}))

const makeViewer = () => ({
    scene: {
        canvas: { clientWidth: 800, clientHeight: 600 },
        pickPositionSupported: true,
        pickPosition: vi.fn(() => ({ x: 1, y: 2, z: 3 })),
        globe: { pick: vi.fn() },
        preRender: { addEventListener: vi.fn(), removeEventListener: vi.fn() }
    },
    camera: {
        heading: 1.2,
        pitch: -0.8,
        positionWC: { x: 9, y: 9, z: 9 },
        getPickRay: vi.fn(() => null),
        pickEllipsoid: vi.fn(() => null),
        flyToBoundingSphere: vi.fn((_sphere: unknown, opts: { complete?: () => void }) =>
            opts.complete?.()
        ),
        flyTo: vi.fn((opts: { complete?: () => void }) => opts.complete?.()),
        setView: vi.fn()
    },
    screenSpaceCameraController: { enableTilt: true }
})

/** watch 비동기 핸들러 + flyTo promise 체인까지 플러시한다 */
const flush = async () => {
    await nextTick()
    for (let i = 0; i < 5; i++) {
        await Promise.resolve()
    }
}

describe('useViewModeSideeffect', () => {
    const store = useViewModeStore()
    let scope: ReturnType<typeof effectScope> | null = null

    const mount = (viewer: ShallowRef<unknown>) => {
        scope = effectScope()
        return scope.run(() =>
            useViewModeSideeffect({ viewer: viewer as ShallowRef<CesiumViewer | null> })
        )!
    }

    beforeEach(async () => {
        store.setMode(ScreenModeEnum.MODE3D)
        store.setTransitioning(false)
        await nextTick()
    })

    afterEach(() => {
        scope?.stop()
        scope = null
        vi.restoreAllMocks()
    })

    it('2D 전환 — 수직(-90°) flyTo + 틸트 잠금 + preRender 가드 부착', async () => {
        const viewer = shallowRef(makeViewer())
        mount(viewer)

        store.setMode(ScreenModeEnum.MODE2D)
        await flush()

        const fly = viewer.value.camera.flyToBoundingSphere
        expect(fly).toHaveBeenCalledTimes(1)
        const opts = fly.mock.calls[0]![1] as {
            offset: { heading: number; pitch: number; range: number }
            duration: number
        }
        expect(opts.offset.pitch).toBeCloseTo(-Math.PI / 2)
        expect(opts.offset.heading).toBe(0)
        expect(opts.offset.range).toBe(1234)
        expect(opts.duration).toBe(3)

        expect(viewer.value.screenSpaceCameraController.enableTilt).toBe(false)
        expect(viewer.value.scene.preRender.addEventListener).toHaveBeenCalledTimes(1)
        expect(store.isTransitioning.value).toBe(false)
    })

    it('3D 복귀 — 가드 해제 + 틸트 복원 + 조감(-45°) flyTo (heading 유지)', async () => {
        const viewer = shallowRef(makeViewer())
        mount(viewer)

        store.setMode(ScreenModeEnum.MODE2D)
        await flush()
        store.setMode(ScreenModeEnum.MODE3D)
        await flush()

        expect(viewer.value.scene.preRender.removeEventListener).toHaveBeenCalled()
        expect(viewer.value.screenSpaceCameraController.enableTilt).toBe(true)

        const fly = viewer.value.camera.flyToBoundingSphere
        expect(fly).toHaveBeenCalledTimes(2)
        const opts = fly.mock.calls[1]![1] as { offset: { heading: number; pitch: number } }
        expect(opts.offset.pitch).toBeCloseTo((-45 * Math.PI) / 180)
        expect(opts.offset.heading).toBe(1.2)
    })

    it('중심 타겟 계산 실패 — camera.flyTo 폴백으로 시점만 전환', async () => {
        const viewer = shallowRef(makeViewer())
        viewer.value.scene.pickPositionSupported = false
        mount(viewer)

        store.setMode(ScreenModeEnum.MODE2D)
        await flush()

        expect(viewer.value.camera.flyToBoundingSphere).not.toHaveBeenCalled()
        expect(viewer.value.camera.flyTo).toHaveBeenCalledTimes(1)
        const opts = viewer.value.camera.flyTo.mock.calls[0]![0] as {
            orientation: { heading: number; pitch: number; roll: number }
        }
        expect(opts.orientation.pitch).toBeCloseTo(-Math.PI / 2)
        expect(opts.orientation.heading).toBe(0)
    })

    it('preRender 가드 — 기울어진 카메라를 수직으로 복원, 수직이면 무동작', async () => {
        const viewer = shallowRef(makeViewer())
        mount(viewer)

        store.setMode(ScreenModeEnum.MODE2D)
        await flush()

        const guard = viewer.value.scene.preRender.addEventListener.mock.calls[0]![0] as () => void

        // 사용자가 시점을 기울인 상황
        viewer.value.camera.pitch = -0.5
        viewer.value.camera.heading = 0.4
        guard()
        expect(viewer.value.camera.setView).toHaveBeenCalledTimes(1)
        const opts = viewer.value.camera.setView.mock.calls[0]![0] as {
            orientation: { heading: number; pitch: number; roll: number }
        }
        expect(opts.orientation.pitch).toBeCloseTo(-Math.PI / 2)
        expect(opts.orientation.heading).toBe(0)

        // 이미 수직이면 setView를 다시 호출하지 않는다
        viewer.value.camera.setView.mockClear()
        viewer.value.camera.pitch = -Math.PI / 2
        viewer.value.camera.heading = 0
        guard()
        expect(viewer.value.camera.setView).not.toHaveBeenCalled()
    })

    it('viewer null — 모드 변경에도 throw 없음, 전환 플래그 미설정', async () => {
        const viewer = shallowRef(null)
        mount(viewer)

        store.setMode(ScreenModeEnum.MODE2D)
        await flush()

        expect(store.isTransitioning.value).toBe(false)
    })

    it('scope stop — preRender 가드 해제', async () => {
        const viewer = shallowRef(makeViewer())
        mount(viewer)

        store.setMode(ScreenModeEnum.MODE2D)
        await flush()

        scope!.stop()
        scope = null
        expect(viewer.value.scene.preRender.removeEventListener).toHaveBeenCalled()
    })
})
