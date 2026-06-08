import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shallowRef, nextTick, effectScope } from 'vue'
import type { ShallowRef } from 'vue'
import { BaseMapEnum } from '#shared/types/base-map.enum'
import { useBaseMapSideeffect } from '~/features/base-map/api/useBaseMapSideeffect'
import { useBaseMapStore } from '~/features/base-map/model/useBaseMapStore'
import type { CesiumViewer } from '~/shared/lib/useWindow'

const createdUrls: string[] = []

vi.mock('~/features/base-map/model/useBaseMapStore', async () => {
    const { ref, computed } = await import('vue')
    const { BaseMapEnum: Kind } = await import('#shared/types/base-map.enum')
    const kind = ref(Kind.SATELLITE)
    const store = {
        kind,
        isSatellite: computed(() => kind.value.isSatellite),
        setKind: (next: unknown) => {
            kind.value = next as never
        }
    }
    return { useBaseMapStore: () => store }
})

vi.mock('~/shared/lib/map/useCesiumRuntime', () => ({
    getCesiumRuntime: () => ({
        UrlTemplateImageryProvider: class {
            url: string
            constructor(opts: { url: string }) {
                this.url = opts.url
                createdUrls.push(opts.url)
            }
        }
    })
}))

const makeViewer = () => ({
    imageryLayers: {
        removeAll: vi.fn(),
        addImageryProvider: vi.fn()
    }
})

describe('useBaseMapSideeffect', () => {
    const store = useBaseMapStore()
    let scope: ReturnType<typeof effectScope> | null = null

    const mount = (viewer: ShallowRef<unknown>) => {
        scope = effectScope()
        return scope.run(() =>
            useBaseMapSideeffect({
                viewer: viewer as ShallowRef<CesiumViewer | null>,
                vworldKey: 'TEST_KEY'
            })
        )!
    }

    beforeEach(async () => {
        createdUrls.length = 0
        store.setKind(BaseMapEnum.SATELLITE)
        await nextTick()
    })

    afterEach(() => {
        scope?.stop()
        scope = null
        vi.restoreAllMocks()
    })

    it('viewer 준비 시 — 위성영상 타일을 즉시 적용', () => {
        const viewer = shallowRef(makeViewer())
        mount(viewer)

        expect(viewer.value.imageryLayers.removeAll).toHaveBeenCalledTimes(1)
        expect(viewer.value.imageryLayers.addImageryProvider).toHaveBeenCalledTimes(1)
        expect(createdUrls[0]).toContain('/TEST_KEY/Satellite/')
    })

    it('기본지도 전환 — 레이어 교체', async () => {
        const viewer = shallowRef(makeViewer())
        mount(viewer)

        store.setKind(BaseMapEnum.BASE)
        await nextTick()

        expect(viewer.value.imageryLayers.removeAll).toHaveBeenCalledTimes(2)
        expect(createdUrls[1]).toContain('/TEST_KEY/Base/')
    })

    it('viewer null — throw 없음, 레이어 미적용', async () => {
        const viewer = shallowRef(null)
        mount(viewer)
        store.setKind(BaseMapEnum.BASE)
        await expect(nextTick()).resolves.toBeUndefined()
        expect(createdUrls.length).toBe(0)
    })
})
