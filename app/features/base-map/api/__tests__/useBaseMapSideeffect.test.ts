import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shallowRef, nextTick, effectScope } from 'vue'
import { BaseMapEnum } from '#shared/types/base-map.enum'
import { useBaseMapSideeffect } from '~/features/base-map/api/useBaseMapSideeffect'
import { useBaseMapStore } from '~/features/base-map/model/useBaseMapStore'
import { useMapViewer } from '~/shared/lib/map/useMapViewer'

// viewer 소유권은 CesiumController(useMapViewer)에 있다. 테스트는 공유 ref 를 직접 제어한다.
vi.mock('~/shared/lib/map/useMapViewer', async () => {
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

const { setViewer: setMockViewer } = useMapViewer() as unknown as {
    setViewer: (v: unknown) => void
}

describe('useBaseMapSideeffect', () => {
    const store = useBaseMapStore()
    let scope: ReturnType<typeof effectScope> | null = null

    const mount = (viewerValue: unknown) => {
        setMockViewer(viewerValue)
        scope = effectScope()
        return scope.run(() =>
            useBaseMapSideeffect({
                vworldKey: 'TEST_KEY'
            })
        )!
    }

    beforeEach(async () => {
        setMockViewer(null)
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
        mount(viewer.value)

        expect(viewer.value.imageryLayers.removeAll).toHaveBeenCalledTimes(1)
        expect(viewer.value.imageryLayers.addImageryProvider).toHaveBeenCalledTimes(1)
        expect(createdUrls[0]).toContain('/TEST_KEY/Satellite/')
    })

    it('기본지도 전환 — 레이어 교체', async () => {
        const viewer = shallowRef(makeViewer())
        mount(viewer.value)

        store.setKind(BaseMapEnum.BASE)
        await nextTick()

        expect(viewer.value.imageryLayers.removeAll).toHaveBeenCalledTimes(2)
        expect(createdUrls[1]).toContain('/TEST_KEY/Base/')
    })

    it('viewer null — throw 없음, 레이어 미적용', async () => {
        mount(null)
        store.setKind(BaseMapEnum.BASE)
        await expect(nextTick()).resolves.toBeUndefined()
        expect(createdUrls.length).toBe(0)
    })
})
