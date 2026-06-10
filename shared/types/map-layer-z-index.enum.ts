/**
 * 지면 고정(clamp) 레이어의 z-index 정렬 enum.
 *
 * 지면에 붙는 레이어들이 겹칠 때 그려지는 순서를 결정한다.
 * zIndex 가 높을수록 위에 그려진다.
 *
 * 정렬 불변식: 시군구 경계 < 읍면동 경계 < 시설물·횡단보도
 * (넓은 행정 경계가 가장 아래, 그 위에 세부 경계, 가장 위에 개별 피처)
 */
import { EnumBase } from './enum-base'

export class MapLayerZIndexEnum extends EnumBase {
    static readonly SGG_BOUNDARY = new MapLayerZIndexEnum('sgg-boundary', '시군구 경계', -2)
    static readonly EMD_BOUNDARY = new MapLayerZIndexEnum('emd-boundary', '읍면동 경계', -1)
    static readonly FEATURE = new MapLayerZIndexEnum('feature', '시설물·횡단보도', 0)

    private constructor(
        key: string,
        label: string,
        /** Cesium 렌더링 z-index. 높을수록 위에 그려짐 */
        public readonly zIndex: number
    ) {
        super(key, label)
    }

    static from(key: string): MapLayerZIndexEnum {
        return (
            EnumBase.fromKey<MapLayerZIndexEnum>(MapLayerZIndexEnum, key) ??
            MapLayerZIndexEnum.FEATURE
        )
    }
}
