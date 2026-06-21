import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowRef } from 'vue'
import type { ShallowRef } from 'vue'

import { useCameraViewSideeffect } from '~/features/camera/api/useCameraViewSideeffect'
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

const sharedStore = vi.hoisted(() => ({
    viewMode: { value: { isFirstPerson: false, isThirdPerson: true } },
    isFirstPerson: { value: false },
    isThirdPerson: { value: true },
    setFirstPerson: vi.fn(function () {
        sharedStore.viewMode.value = { isFirstPerson: true, isThirdPerson: false }
    }),
    setThirdPerson: vi.fn(function () {
        sharedStore.viewMode.value = { isFirstPerson: false, isThirdPerson: true }
    })
}))
vi.mock('~/features/camera/model/useCameraViewStore', () => ({
    useCameraViewStore: () => sharedStore
}))

const makeCtrl = () => ({
    rotateEventTypes: 'left-drag',
    zoomEventTypes: ['wheel'],
    enableTilt: true,
    enableRotate: true,
    enableLook: false,
    enableZoom: true,
    enableTranslate: true
})

const makeViewer = () => ({ screenSpaceCameraController: makeCtrl() })

const { setViewer: setMockViewer } = useMapViewer() as unknown as {
    setViewer: (v: unknown) => void
}

describe('useCameraViewSideeffect', () => {
    let viewer: ShallowRef<any>

    beforeEach(() => {
        setMockViewer(null)
        viewer = shallowRef(makeViewer())
        setMockViewer(viewer.value)
        sharedStore.setFirstPerson.mockClear()
        sharedStore.setThirdPerson.mockClear()
    })

    it('enableFirstPerson — 컨트롤 잠금 + store.setFirstPerson 호출', () => {
        const sideeffect = useCameraViewSideeffect()
        sideeffect.enableFirstPerson()

        const ctrl = viewer.value.screenSpaceCameraController
        expect(ctrl.enableRotate).toBe(false)
        expect(ctrl.enableTilt).toBe(false)
        expect(ctrl.enableZoom).toBe(false)
        expect(ctrl.enableTranslate).toBe(false)
        expect(ctrl.enableLook).toBe(true)
        expect(sharedStore.setFirstPerson).toHaveBeenCalledOnce()
    })

    it('restoreThirdPerson — 저장된 값으로 복원 + store.setThirdPerson', () => {
        const sideeffect = useCameraViewSideeffect()
        sideeffect.enableFirstPerson()

        sideeffect.restoreThirdPerson()
        const ctrl = viewer.value.screenSpaceCameraController
        expect(ctrl.enableRotate).toBe(true)
        expect(ctrl.enableTilt).toBe(true)
        expect(ctrl.enableLook).toBe(false)
        expect(ctrl.enableZoom).toBe(true)
        expect(ctrl.enableTranslate).toBe(true)
        expect(sharedStore.setThirdPerson).toHaveBeenCalledOnce()
    })

    it('viewer null 이면 두 함수 모두 무동작 (throw 없음)', () => {
        setMockViewer(null)
        const sideeffect = useCameraViewSideeffect()
        expect(() => sideeffect.enableFirstPerson()).not.toThrow()
        expect(() => sideeffect.restoreThirdPerson()).not.toThrow()
        expect(sharedStore.setFirstPerson).not.toHaveBeenCalled()
    })

    it('screenSpaceCameraController 가 없으면 무동작', () => {
        setMockViewer({ screenSpaceCameraController: null })
        const sideeffect = useCameraViewSideeffect()
        sideeffect.enableFirstPerson()
        expect(sharedStore.setFirstPerson).not.toHaveBeenCalled()
    })
})
