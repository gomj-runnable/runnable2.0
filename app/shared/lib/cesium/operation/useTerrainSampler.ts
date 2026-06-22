import type { Cartographic } from 'cesium'
import type { GeoJsonPosition } from '#shared/types/geojson'
import { useCesiumController } from '~/shared/lib/cesium/CesiumController'
import { useMapViewer } from '~/shared/lib/cesium/getters/useMapViewer'
import { densifyPositions } from '~/shared/lib/geo/densifyPositions'

/**
 * Cesium 지형 고도 샘플링 operation.
 * Cesium 런타임(`controller.runtime`)과 viewer 의 terrainProvider 로 직접 샘플링하고,
 * 순수 보간(`densifyPositions`)을 조립해 "보간 후 샘플링" 파이프라인을 소유한다.
 * Controller 는 terrain 을 알지 못한다 — runtime·viewer 접근 primitive 만 제공한다.
 *
 * - `sampleTerrain`            : 좌표 배열 고도 샘플링
 * - `densifyAndSample`         : 보간 후 샘플링
 * - `densifyAndSampleSections` : 구간 배열을 보간+단일 배치 샘플링 후 구간별로 재분배
 */
export const useTerrainSampler = () => {
    const { viewer } = useMapViewer()
    const controller = useCesiumController()

    const sampleTerrain = async (positions: GeoJsonPosition[]): Promise<GeoJsonPosition[]> => {
        const v = viewer.value
        if (!v || positions.length === 0) return positions

        const C = controller.runtime
        const cartographics = positions.map(([lng, lat]) => C.Cartographic.fromDegrees(lng, lat))

        try {
            const sampled = await C.sampleTerrainMostDetailed(v.terrainProvider, cartographics)
            return sampled.map(
                (c: Cartographic) =>
                    [
                        C.Math.toDegrees(c.longitude),
                        C.Math.toDegrees(c.latitude),
                        c.height ?? 0
                    ] as GeoJsonPosition
            )
        } catch {
            return positions
        }
    }

    const densifyAndSample = (positions: GeoJsonPosition[]) =>
        sampleTerrain(densifyPositions(positions))

    const densifyAndSampleSections = async <T extends { positions: GeoJsonPosition[] }>(
        sections: T[]
    ): Promise<T[]> => {
        const densified = sections.map((s) => densifyPositions(s.positions))
        const sampled = await sampleTerrain(densified.flat())

        let offset = 0
        return sections.map((s, i) => {
            const len = densified[i]!.length
            const positions = sampled.slice(offset, offset + len)
            offset += len
            return { ...s, positions }
        })
    }

    return { sampleTerrain, densifyAndSample, densifyAndSampleSections }
}
