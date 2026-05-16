import type { ShallowRef } from 'vue'
import type { CesiumViewer } from '~/shared/lib/useWindow'
import { useTerrainSampler } from '~/shared/lib/map/useTerrainSampler'

/**
 * 지형 고도 샘플링 기능을 제공하는 sub-facade.
 */
export const useRouteTerrainFacade = (viewer: ShallowRef<CesiumViewer | null>) => {
    const terrainSampler = useTerrainSampler(viewer)

    return { terrainSampler }
}
