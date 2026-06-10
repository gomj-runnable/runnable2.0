import { describe, it, expect } from 'vitest'
import { MapLayerZIndexEnum } from '../map-layer-z-index.enum'

describe('MapLayerZIndexEnum', () => {
    it('읍면동 경계가 시군구 경계보다 위에 그려진다', () => {
        expect(MapLayerZIndexEnum.EMD_BOUNDARY.zIndex).toBeGreaterThan(
            MapLayerZIndexEnum.SGG_BOUNDARY.zIndex
        )
    })

    it('시설물·횡단보도가 읍면동 경계보다 위에 그려진다', () => {
        expect(MapLayerZIndexEnum.FEATURE.zIndex).toBeGreaterThan(
            MapLayerZIndexEnum.EMD_BOUNDARY.zIndex
        )
    })

    it("from('emd-boundary') 는 EMD_BOUNDARY 를 반환한다", () => {
        expect(MapLayerZIndexEnum.from('emd-boundary')).toBe(MapLayerZIndexEnum.EMD_BOUNDARY)
    })

    it('없는 키는 기본값 FEATURE 를 반환한다', () => {
        expect(MapLayerZIndexEnum.from('없는키')).toBe(MapLayerZIndexEnum.FEATURE)
    })
})
