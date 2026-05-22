import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'

import { createToggleLayerSideeffect } from '~/shared/lib/map/createToggleLayerSideeffect'

vi.stubGlobal('onBeforeUnmount', vi.fn())

describe('createToggleLayerSideeffect()', () => {
    it('source 가 truthy 면 apply, falsy 면 remove (immediate)', async () => {
        const source = ref(false)
        const apply = vi.fn()
        const remove = vi.fn()
        const { init } = createToggleLayerSideeffect({ source, apply, remove })
        init()
        // immediate: true 로 초기 false → remove 호출
        expect(remove).toHaveBeenCalledTimes(1)
        expect(apply).not.toHaveBeenCalled()

        source.value = true
        await Promise.resolve()
        expect(apply).toHaveBeenCalledTimes(1)
    })

    it('condition 이 제공되면 그 결과로 apply/remove 결정', async () => {
        const source = ref([false, null] as [boolean, unknown])
        const apply = vi.fn()
        const remove = vi.fn()
        const { init } = createToggleLayerSideeffect({
            source,
            condition: ([visible, data]) => visible && data != null,
            apply,
            remove
        })
        init()
        expect(remove).toHaveBeenCalledTimes(1)

        source.value = [true, 'data'] as any
        await Promise.resolve()
        expect(apply).toHaveBeenCalledTimes(1)
    })

    it('onBeforeUnmount 에 cleanup 등록', () => {
        const cleanup = vi.fn()
        const { init } = createToggleLayerSideeffect({
            source: ref(false),
            apply: vi.fn(),
            remove: vi.fn(),
            cleanup
        })
        init()
        // onBeforeUnmount 가 stub 으로 등록만 받았는지 확인
        // (실제 unmount 시점 호출은 컴포넌트 라이프사이클이 없으므로 검증 불가능)
        expect((globalThis as any).onBeforeUnmount).toHaveBeenCalled()
    })
})
