import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowRef } from 'vue'
import type { Ref, ShallowRef } from 'vue'

import { useCameraViewSideeffect } from '~/features/camera/api/useCameraViewSideeffect'

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

describe('useCameraViewSideeffect', () => {
    let viewer: ShallowRef<any>

    beforeEach(() => {
        viewer = shallowRef(makeViewer())
        sharedStore.setFirstPerson.mockClear()
        sharedStore.setThirdPerson.mockClear()
    })

    it('enableFirstPerson — 컨트롤 잠금 + store.setFirstPerson 호출', () => {
        const sideeffect = useCameraViewSideeffect({ viewer: viewer as any })
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
        const sideeffect = useCameraViewSideeffect({ viewer: viewer as any })
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
        viewer.value = null
        const sideeffect = useCameraViewSideeffect({ viewer: viewer as any })
        expect(() => sideeffect.enableFirstPerson()).not.toThrow()
        expect(() => sideeffect.restoreThirdPerson()).not.toThrow()
        expect(sharedStore.setFirstPerson).not.toHaveBeenCalled()
    })

    it('screenSpaceCameraController 가 없으면 무동작', () => {
        viewer.value = { screenSpaceCameraController: null }
        const sideeffect = useCameraViewSideeffect({ viewer: viewer as any })
        sideeffect.enableFirstPerson()
        expect(sharedStore.setFirstPerson).not.toHaveBeenCalled()
    })
})
