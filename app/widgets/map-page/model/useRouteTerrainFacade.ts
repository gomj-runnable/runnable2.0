import { useTerrainSampler } from '~/shared/lib/cesium/operation/useTerrainSampler'

/**
 * 지형 고도 샘플링 기능을 제공하는 sub-facade.
 */
export const useRouteTerrainFacade = () => {
    const terrainSampler = useTerrainSampler()

    return { terrainSampler }
}
