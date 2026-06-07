import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shallowRef, nextTick, effectScope } from 'vue'
import type { ShallowRef } from 'vue'
import { GraphicQualityEnum } from '#shared/types/graphic-quality.enum'
import {
    useGraphicQualitySideeffect,
    decideAutoLevel
} from '~/features/graphic-quality/api/useGraphicQualitySideeffect'
import { useGraphicQualityStore } from '~/features/graphic-quality/model/useGraphicQualityStore'
import type { CesiumViewer } from '~/shared/lib/useWindow'

vi.mock('~/features/graphic-quality/model/useGraphicQualityStore', async () => {
    const { ref, computed } = await import('vue')
    const { GraphicQualityEnum: Quality } = await import('#shared/types/graphic-quality.enum')
    const level = ref(Quality.AUTO)
    const appliedLevel = ref(Quality.HIGH)
    const store = {
        level,
        appliedLevel,
        isAuto: computed(() => level.value.isAuto),
        setLevel: (next: unknown) => {
            level.value = next as never
        },
        setAppliedLevel: (next: unknown) => {
            appliedLevel.value = next as never
        }
    }
    return { useGraphicQualityStore: () => store }
})

const makeTileset = () => ({ maximumScreenSpaceError: 0 })

const makeViewer = (tileset = makeTileset()) => ({
    resolutionScale: 1,
    shadows: true,
    scene: {
        requestRenderMode: false,
        maximumRenderTimeChange: 0,
        msaaSamples: 4,
        postProcessStages: { fxaa: { enabled: true } },
        postRender: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
        primitives: { length: 1, get: () => tileset }
    }
})

describe('useGraphicQualitySideeffect', () => {
    const store = useGraphicQualityStore()
    let scope: ReturnType<typeof effectScope> | null = null

    const mount = (viewer: ShallowRef<unknown>) => {
        scope = effectScope()
        return scope.run(() =>
            useGraphicQualitySideeffect({
                viewer: viewer as ShallowRef<CesiumViewer | null>
            })
        )
    }

    beforeEach(async () => {
        store.setLevel(GraphicQualityEnum.AUTO)
        store.setAppliedLevel(GraphicQualityEnum.HIGH)
        await nextTick()
    })

    afterEach(() => {
        scope?.stop()
        scope = null
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('decideAutoLevel — FPS 구간 매핑 (15~40 구간은 현재 레벨 유지)', () => {
        expect(decideAutoLevel(10)).toBe('low')
        expect(decideAutoLevel(30)).toBe(null)
        expect(decideAutoLevel(50)).toBe('medium')
        expect(decideAutoLevel(70)).toBe('high')
    })

    it('생성 시(auto 기본) — FPS 측정기 부착', () => {
        const viewer = shallowRef(makeViewer())
        mount(viewer)
        expect(viewer.value.scene.postRender.addEventListener).toHaveBeenCalledTimes(1)
    })

    it('고정 low 선택 — 프리셋 적용 + 타일셋 SSE 16 + 자동 측정 해제', async () => {
        const tileset = makeTileset()
        const viewer = shallowRef(makeViewer(tileset))
        mount(viewer)

        store.setLevel(GraphicQualityEnum.LOW)
        await nextTick()

        const s = viewer.value.scene
        expect(s.requestRenderMode).toBe(true)
        expect(s.maximumRenderTimeChange).toBe(Infinity)
        expect(viewer.value.resolutionScale).toBe(0.7)
        expect(s.msaaSamples).toBe(1)
        expect(s.postProcessStages.fxaa.enabled).toBe(false)
        expect(viewer.value.shadows).toBe(false)
        expect(tileset.maximumScreenSpaceError).toBe(16)
        expect(s.postRender.removeEventListener).toHaveBeenCalled()
        expect(store.appliedLevel.value.key).toBe(GraphicQualityEnum.LOW.key)
    })

    it('auto 복귀 — 적용 레벨은 유지하되 온디맨드 렌더는 강제 해제 (FPS 측정 보장)', async () => {
        const viewer = shallowRef(makeViewer())
        mount(viewer)

        store.setLevel(GraphicQualityEnum.LOW)
        await nextTick()
        store.setLevel(GraphicQualityEnum.AUTO)
        await nextTick()

        expect(viewer.value.scene.requestRenderMode).toBe(false)
        expect(viewer.value.resolutionScale).toBe(0.7)
        expect(store.appliedLevel.value.key).toBe(GraphicQualityEnum.LOW.key)
    })

    it('자동 조정 — 평균 FPS 15 미만이면 low 프리셋 적용', () => {
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
        let now = 0
        vi.spyOn(performance, 'now').mockImplementation(() => now)

        const viewer = shallowRef(makeViewer())
        mount(viewer)

        const measure = viewer.value.scene.postRender.addEventListener.mock.calls[0]![0] as
            | (() => void)
            | undefined
        expect(measure).toBeTypeOf('function')

        // 1.2초 동안 2프레임 → 약 1.7 FPS
        measure!() // 측정 기준 시각 초기화
        now = 600
        measure!()
        now = 1200
        measure!()

        vi.advanceTimersByTime(5000)

        expect(store.appliedLevel.value.key).toBe(GraphicQualityEnum.LOW.key)
        // 자동 모드에선 low 프리셋이라도 온디맨드 렌더는 끈다 (postRender 미발생 → FPS 0 오측정 방지)
        expect(viewer.value.scene.requestRenderMode).toBe(false)
        expect(viewer.value.resolutionScale).toBe(0.7)
    })

    it('자동 조정 — 평균 FPS 60 초과면 high 프리셋 적용', async () => {
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
        let now = 0
        vi.spyOn(performance, 'now').mockImplementation(() => now)

        const viewer = shallowRef(makeViewer())
        mount(viewer)
        store.setAppliedLevel(GraphicQualityEnum.MEDIUM)
        await nextTick()

        const measure = viewer.value.scene.postRender.addEventListener.mock
            .calls[0]![0] as () => void

        measure() // 측정 기준 시각 초기화
        // 1.05초 동안 70프레임 → 약 66.7 FPS
        for (let frame = 1; frame <= 70; frame++) {
            now = frame * 15
            measure()
        }

        vi.advanceTimersByTime(5000)

        expect(store.appliedLevel.value.key).toBe(GraphicQualityEnum.HIGH.key)
        expect(viewer.value.scene.msaaSamples).toBe(4)
        expect(viewer.value.scene.postProcessStages.fxaa.enabled).toBe(true)
    })

    it('viewer null — 레벨 변경에도 throw 없음', async () => {
        const viewer = shallowRef(null)
        mount(viewer)
        store.setLevel(GraphicQualityEnum.LOW)
        await expect(nextTick()).resolves.toBeUndefined()
    })

    it('scope stop — FPS 측정기 해제', () => {
        const viewer = shallowRef(makeViewer())
        mount(viewer)
        scope!.stop()
        scope = null
        expect(viewer.value.scene.postRender.removeEventListener).toHaveBeenCalled()
    })
})
