import { describe, it, expect } from 'vitest'
import {
    isBuildingPick,
    findNearestGroundPosition
} from '~/features/camera/lib/useBuildingDetection'

describe('isBuildingPick()', () => {
    it('null/undefined → false', () => {
        expect(isBuildingPick(null)).toBe(false)
        expect(isBuildingPick(undefined)).toBe(false)
    })

    it('tileset 필드 있음 → true', () => {
        expect(isBuildingPick({ tileset: {} })).toBe(true)
    })

    it('primitive.constructor.name === Cesium3DTileset → true', () => {
        const ctor = function Cesium3DTileset() {}
        expect(isBuildingPick({ primitive: { constructor: ctor } })).toBe(true)
    })

    it('content 필드 있음 → true', () => {
        expect(isBuildingPick({ content: {} })).toBe(true)
    })

    it('기타 → false', () => {
        expect(isBuildingPick({ primitive: { constructor: { name: 'Entity' } } })).toBe(false)
        expect(isBuildingPick({})).toBe(false)
    })
})

describe('findNearestGroundPosition()', () => {
    const mockCesiumLib = {
        Cartesian2: function (x: number, y: number) {
            return { x, y }
        } as any,
        defined: (val: any) => val !== null && val !== undefined
    }

    it('scene 이 없으면 null + corrected=false', () => {
        const result = findNearestGroundPosition({}, mockCesiumLib, { x: 0, y: 0 })
        expect(result.snappedPosition).toBeNull()
        expect(result.corrected).toBe(false)
    })

    it('windowPosition 이 없으면 null + corrected=false', () => {
        const result = findNearestGroundPosition({ scene: {} }, mockCesiumLib, null)
        expect(result.snappedPosition).toBeNull()
        expect(result.corrected).toBe(false)
    })

    it('첫번째 비건물 지점 발견 시 pickPosition 결과 반환', () => {
        const expectedPos = { x: 1, y: 2, z: 3 }
        const scene = {
            pick: () => null, // 모두 비건물
            pickPositionSupported: true,
            pickPosition: () => expectedPos
        }
        const result = findNearestGroundPosition({ scene }, mockCesiumLib, { x: 100, y: 100 })
        expect(result.snappedPosition).toBe(expectedPos)
        expect(result.corrected).toBe(true)
    })

    it('pickPosition 실패 시 globe.pick 폴백 사용', () => {
        const expectedPos = { x: 9, y: 9, z: 9 }
        const scene = {
            pick: () => null,
            pickPositionSupported: false,
            globe: { pick: () => expectedPos }
        }
        const result = findNearestGroundPosition(
            { scene, camera: { getPickRay: () => ({ origin: {}, direction: {} }) } },
            mockCesiumLib,
            { x: 100, y: 100 }
        )
        expect(result.snappedPosition).toBe(expectedPos)
    })

    it('모든 시도 실패 → null', () => {
        const scene = {
            pick: () => ({ tileset: {} }), // 항상 건물
            pickPositionSupported: true,
            pickPosition: () => null
        }
        const result = findNearestGroundPosition({ scene }, mockCesiumLib, { x: 100, y: 100 })
        expect(result.snappedPosition).toBeNull()
        expect(result.corrected).toBe(false)
    })
})
