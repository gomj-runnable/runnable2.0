import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowRef } from 'vue'
import type { Ref, ShallowRef } from 'vue'

import { useTerrainSampler } from '~/shared/lib/map/useTerrainSampler'

const sampleTerrainMostDetailed = vi.fn()
const C = {
    Cartographic: { fromDegrees: (lng: number, lat: number) => ({ lng, lat }) },
    Math: {
        toDegrees: (rad: number) => rad * 1.0 // 단위 변환 mock — 값 그대로 통과
    },
    sampleTerrainMostDetailed
}
vi.stubGlobal('window', { Cesium: C } as any)

describe('useTerrainSampler.sampleTerrain()', () => {
    let viewer: ShallowRef<any>

    beforeEach(() => {
        viewer = shallowRef({ terrainProvider: { id: 'tp' } })
        sampleTerrainMostDetailed.mockReset()
    })

    it('viewer 가 null 이면 원본 반환', async () => {
        viewer.value = null
        const { sampleTerrain } = useTerrainSampler(viewer)
        const positions = [[127, 37, 0]] as any
        await expect(sampleTerrain(positions)).resolves.toBe(positions)
    })

    it('positions 빈 배열은 원본 반환', async () => {
        const { sampleTerrain } = useTerrainSampler(viewer)
        await expect(sampleTerrain([])).resolves.toEqual([])
    })

    it('샘플링 성공 — height 가 반영된 새 배열', async () => {
        sampleTerrainMostDetailed.mockResolvedValue([{ longitude: 127, latitude: 37, height: 55 }])
        const { sampleTerrain } = useTerrainSampler(viewer)
        const result = await sampleTerrain([[127, 37, 0]])
        expect(result).toEqual([[127, 37, 55]])
    })

    it('샘플링 실패(throw) 시 원본 반환', async () => {
        sampleTerrainMostDetailed.mockRejectedValue(new Error('terrain error'))
        const { sampleTerrain } = useTerrainSampler(viewer)
        const positions = [[127, 37, 0]] as any
        await expect(sampleTerrain(positions)).resolves.toBe(positions)
    })

    it('height 누락 시 0 으로 처리', async () => {
        sampleTerrainMostDetailed.mockResolvedValue([{ longitude: 127, latitude: 37 }])
        const { sampleTerrain } = useTerrainSampler(viewer)
        const result = await sampleTerrain([[127, 37, 0]])
        expect(result).toEqual([[127, 37, 0]])
    })
})

describe('useTerrainSampler.densifyAndSample() / Sections()', () => {
    let viewer: ShallowRef<any>

    beforeEach(() => {
        viewer = shallowRef({ terrainProvider: {} })
        sampleTerrainMostDetailed.mockReset()
    })

    it('densifyAndSample — 직선 보간 후 샘플 (terrain 결과 그대로)', async () => {
        // densifyPositions 가 2개 좌표를 N개로 늘리므로 sampleTerrainMostDetailed 가 그 길이로 호출됨
        sampleTerrainMostDetailed.mockImplementation(async (_provider, carts) =>
            carts.map((c: any) => ({ longitude: c.lng, latitude: c.lat, height: 10 }))
        )
        const { densifyAndSample } = useTerrainSampler(viewer)
        const result = await densifyAndSample([
            [127, 37, 0],
            [127.01, 37.01, 0]
        ])
        expect(result.length).toBeGreaterThanOrEqual(2)
        expect(result.every((p) => p[2] === 10)).toBe(true)
    })

    it('densifyAndSampleSections — 각 section.positions 변환', async () => {
        sampleTerrainMostDetailed.mockImplementation(async (_provider, carts) =>
            carts.map((c: any) => ({ longitude: c.lng, latitude: c.lat, height: 7 }))
        )
        const { densifyAndSampleSections } = useTerrainSampler(viewer)
        const sections = [
            {
                label: 'A',
                color: '#fff',
                positions: [
                    [127, 37, 0],
                    [127.01, 37.01, 0]
                ] as any
            }
        ]
        const result = await densifyAndSampleSections(sections)
        expect(result).toHaveLength(1)
        expect(result[0]!.label).toBe('A')
        expect(result[0]!.positions.every((p: any) => p[2] === 7)).toBe(true)
    })
})
