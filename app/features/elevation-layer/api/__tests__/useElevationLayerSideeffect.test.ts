import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, shallowRef, nextTick, watch as vueWatch } from 'vue'
import type { Ref, ShallowRef } from 'vue'

import { useElevationLayerSideeffect } from '~/features/elevation-layer/api/useElevationLayerSideeffect'

vi.stubGlobal('onBeforeUnmount', vi.fn())
vi.stubGlobal('watch', vueWatch)

const createElevationBandMaterial = vi.fn(() => ({ name: 'banded' }))
const fromType = vi.fn(() => ({ name: 'contour' }))

const C: any = {
    Color: {
        fromCssColorString: (s: string) => ({ withAlpha: (a: number) => ({ css: s, alpha: a }) }),
        YELLOW: { name: 'yellow' }
    },
    createElevationBandMaterial,
    Material: { fromType }
}
vi.stubGlobal('window', { Cesium: C } as any)

const makeViewer = () => {
    return {
        scene: {
            globe: {
                material: { name: 'original' },
                depthTestAgainstTerrain: false
            }
        }
    }
}

describe('useElevationLayerSideeffect', () => {
    let viewer: ShallowRef<any>
    let isVisible: Ref<boolean>

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        isVisible = ref(false)
        createElevationBandMaterial.mockClear()
        fromType.mockClear()
    })

    it('isVisible=true 시 createElevationBandMaterial 호출, depthTestAgainstTerrain=true', async () => {
        const { init } = useElevationLayerSideeffect({
            viewer: viewer as any,
            isElevationVisible: isVisible
        })
        init()
        isVisible.value = true
        await nextTick()

        expect(createElevationBandMaterial).toHaveBeenCalledOnce()
        expect(viewer.value.scene.globe.material).toEqual({ name: 'banded' })
        expect(viewer.value.scene.globe.depthTestAgainstTerrain).toBe(true)
    })

    it('isVisible=true → false 토글 시 apply 직전 material 로 복원', async () => {
        const { init } = useElevationLayerSideeffect({
            viewer: viewer as any,
            isElevationVisible: isVisible
        })
        init()
        // immediate: true 로 초기 false → remove 호출 (originalMaterial 은 아직 null)
        await nextTick()
        // 명시적으로 의미 있는 material 설정 후 toggle on/off
        const customMaterial = { name: 'pre-apply' }
        viewer.value.scene.globe.material = customMaterial
        isVisible.value = true
        await nextTick()
        // banded material 적용
        expect(viewer.value.scene.globe.material).toEqual({ name: 'banded' })

        isVisible.value = false
        await nextTick()
        // toggle off 시 apply 직전 material 복원
        expect(viewer.value.scene.globe.material).toBe(customMaterial)
    })

    it('createElevationBandMaterial 미지원 — Material.fromType 폴백', async () => {
        delete C.createElevationBandMaterial
        const { init } = useElevationLayerSideeffect({
            viewer: viewer as any,
            isElevationVisible: isVisible
        })
        init()
        isVisible.value = true
        await nextTick()
        expect(fromType).toHaveBeenCalledOnce()
        expect(viewer.value.scene.globe.material).toEqual({ name: 'contour' })
        // 복원
        C.createElevationBandMaterial = createElevationBandMaterial
    })

    it('viewer 가 null 이면 apply/remove 둘 다 무동작', async () => {
        viewer.value = null
        const { init } = useElevationLayerSideeffect({
            viewer: viewer as any,
            isElevationVisible: isVisible
        })
        init()
        isVisible.value = true
        await nextTick()
        expect(createElevationBandMaterial).not.toHaveBeenCalled()
    })
})
