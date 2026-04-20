import type { SeoulDistrictData, SeoulGuMeta } from '#shared/types/district'

/**
 * 서울 행정구역의 중앙 store.
 * 메타데이터(시군구/법정동 목록)와 boundary GeoJSON을 한 곳에서 관리한다.
 * 서버 API에서 1회 로드하여 모든 소비자에게 제공한다.
 */
export const useDistrictStore = () => {
    const data = useState<SeoulDistrictData | null>('district.data', () => null)

    /** 캐시된 시군구 boundary GeoJSON */
    const guGeojson = useState<unknown>('district.guGeojson', () => null)
    /** 캐시된 법정동 boundary GeoJSON */
    const dongGeojson = useState<unknown>('district.dongGeojson', () => null)

    const guList = computed<SeoulGuMeta[]>(() => data.value?.gu ?? [])
    const guNames = computed<string[]>(() => guList.value.map((g) => g.name))
    const dongMap = computed(() => data.value?.dongMap ?? {})

    /** name → SeoulGuMeta O(1) 조회 */
    const guByName = computed(() => new Map(guList.value.map((g) => [g.name, g])))

    /** 특정 시군구의 법정동 목록 반환 */
    const getDongList = (guName: string): string[] => dongMap.value[guName] ?? []

    return {
        data,
        guList,
        guNames,
        guByName,
        dongMap,
        getDongList,
        guGeojson,
        dongGeojson
    }
}
