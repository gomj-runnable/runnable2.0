import { BaseMapEnum } from '#shared/types/base-map.enum'

/**
 * 베이스맵(V-World 위성영상/기본지도) 상태를 관리하는 store composable.
 * 실제 imageryLayers 교체는 `useBaseMapSideeffect`에 위임한다.
 */
export const useBaseMapStore = () => {
    /** 현재 베이스맵 종류 */
    const kind = useState<BaseMapEnum>('baseMap.kind', () => BaseMapEnum.SATELLITE)

    /** 위성영상 여부 */
    const isSatellite = computed(() => kind.value.isSatellite)

    /** 베이스맵을 명시적으로 설정한다. */
    const setKind = (next: BaseMapEnum) => {
        kind.value = next
    }

    /** 위성영상 ↔ 기본지도를 토글한다. */
    const toggle = () => {
        kind.value = kind.value.isSatellite ? BaseMapEnum.BASE : BaseMapEnum.SATELLITE
    }

    return {
        kind,
        isSatellite,
        setKind,
        toggle
    }
}
