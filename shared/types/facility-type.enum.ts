import { EnumBase } from './enum-base'
import type { PoiType } from './facility'

/**
 * 시설물 유형 enum class.
 * 유형별 label, icon, color, poiType을 인스턴스에 공존시킨다.
 */
export class FacilityTypeEnum extends EnumBase {
    static readonly SIDEWALK = new FacilityTypeEnum('sidewalk', '인도 표시', 'i-lucide-route', '#78909C', null)
    static readonly CROSSWALK = new FacilityTypeEnum('crosswalk', '횡단보도', 'i-lucide-footprints', '#4CAF50', 'CROSSWALK')
    static readonly FOUNTAIN = new FacilityTypeEnum('fountain', '음수대', 'i-lucide-droplets', '#2196F3', 'WATER')
    static readonly LOCKER = new FacilityTypeEnum('locker', '보관함', 'i-lucide-package', '#9C27B0', null)
    static readonly HOSPITAL = new FacilityTypeEnum('hospital', '병원', 'i-lucide-cross', '#F44336', 'HOSPITAL')

    private constructor(
        key: string,
        label: string,
        public readonly icon: string,
        public readonly color: string,
        public readonly poiType: PoiType | null
    ) {
        super(key, label)
    }

    /** key 문자열로 인스턴스를 찾는다 */
    static from(key: string): FacilityTypeEnum | undefined {
        return EnumBase.fromKey<FacilityTypeEnum>(FacilityTypeEnum, key)
    }

    /** FacilityLayerConfig 호환 객체를 반환한다 */
    toLayerConfig() {
        return {
            type: this.key as import('./facility').FacilityType,
            label: this.label,
            icon: this.icon,
            color: this.color
        }
    }
}
