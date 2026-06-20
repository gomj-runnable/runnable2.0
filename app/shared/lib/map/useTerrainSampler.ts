import type { ShallowRef } from 'vue'
import type { GeoJsonPosition } from '#shared/types/geojson'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { useCesiumController } from '~/shared/lib/map/CesiumController'

/**
 * Cesium 지형 고도 샘플링 헬퍼.
 * 내부적으로 `CesiumController` 의 terrain capability 로 위임하며,
 * 주입된 viewer 를 그대로 컨트롤러에 전달해 기존 viewer 주입 호출 방식과 호환된다.
 *
 * 단일 좌표 배열 샘플링(`sampleTerrain`)과
 * 구간 배열의 보간+샘플링 파이프라인(`densifyAndSampleSections`)을 제공한다.
 */
export const useTerrainSampler = (viewer: ShallowRef<CesiumViewer | null>) => {
    const controller = useCesiumController()

    return {
        sampleTerrain: (positions: GeoJsonPosition[]) =>
            controller.sampleTerrain(positions, viewer),
        densifyAndSample: (positions: GeoJsonPosition[]) =>
            controller.densifyAndSample(positions, viewer),
        densifyAndSampleSections: <T extends { positions: GeoJsonPosition[] }>(sections: T[]) =>
            controller.densifyAndSampleSections(sections, viewer)
    }
}
