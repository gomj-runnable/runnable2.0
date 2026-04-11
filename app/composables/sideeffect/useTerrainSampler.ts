import type { ShallowRef } from 'vue'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { CesiumViewer } from '~/composables/useWindow'

/**
 * Cesium 지형 프로바이더를 사용해 위치 배열의 실제 지형 고도를 샘플링한다.
 * 지형 프로바이더가 없거나 샘플링에 실패하면 원본 위치를 그대로 반환한다.
 */
export const useTerrainSampler = (viewer: ShallowRef<CesiumViewer | null>) => {
    /**
     * 위치 배열의 고도를 Cesium 지형 프로바이더로 샘플링하여 채운다.
     * 뷰어 미준비, Cesium 미로드, 샘플링 실패 시 원본 배열을 그대로 반환한다.
     *
     * @param positions - 고도를 채울 WGS84 좌표 배열 (고도 값은 0으로 초기화된 상태)
     * @returns 실제 지형 고도가 반영된 WGS84 좌표 배열
     */
    const sampleTerrain = async (positions: GeoJsonPosition[]): Promise<GeoJsonPosition[]> => {
        const v = viewer.value
        const C = window.Cesium

        if (!v || !C || positions.length === 0) {
            return positions
        }

        const cartographics = positions.map(([lng, lat]) =>
            C.Cartographic.fromDegrees(lng, lat)
        )

        try {
            const sampled = await C.sampleTerrainMostDetailed(
                v.terrainProvider,
                cartographics
            )

            return sampled.map((c: InstanceType<typeof C.Cartographic>) => [
                C.Math.toDegrees(c.longitude),
                C.Math.toDegrees(c.latitude),
                c.height ?? 0
            ] as GeoJsonPosition)
        } catch {
            return positions
        }
    }

    return { sampleTerrain }
}
