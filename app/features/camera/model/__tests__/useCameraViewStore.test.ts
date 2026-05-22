import { describe, it, expect } from 'vitest'
import { useCameraViewStore } from '../useCameraViewStore'

describe('useCameraViewStore', () => {
    it('초기값 third-person', () => {
        const s = useCameraViewStore()
        expect(s.isThirdPerson.value).toBe(true)
        expect(s.isFirstPerson.value).toBe(false)
    })

    it('setFirstPerson / setThirdPerson 전환', () => {
        const s = useCameraViewStore()
        s.setFirstPerson()
        expect(s.isFirstPerson.value).toBe(true)
        expect(s.isThirdPerson.value).toBe(false)

        s.setThirdPerson()
        expect(s.isThirdPerson.value).toBe(true)
        expect(s.isFirstPerson.value).toBe(false)
    })
})
