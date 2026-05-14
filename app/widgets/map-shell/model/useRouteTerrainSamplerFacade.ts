import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { useTerrainSampler } from '~/shared/lib/map/useTerrainSampler'

/**
 * Cesium terrain sampling을 단일 책임 단위로 노출하는 facade.
 *
 * 본 facade는 `useTerrainSampler` lib을 thin wrapping. 동일 페이지에서 viewer 단위로 한 번만 사용한다.
 *
 * #112 결정(8분할, 점진적 마이그레이션, `useXxxFacade` 명명) 반영.
 */
export const useRouteTerrainSamplerFacade = (viewer: ShallowRef<CesiumViewer | null>) => {
    const sampler = useTerrainSampler(viewer)
    return {
        sampleTerrain: sampler.sampleTerrain,
        densifyAndSample: sampler.densifyAndSample,
        densifyAndSampleSections: sampler.densifyAndSampleSections
    }
}
