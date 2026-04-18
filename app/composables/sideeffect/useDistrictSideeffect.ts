import { useDistrictStore } from '~/composables/store/useDistrictStore'

/**
 * 서울 행정구역 데이터를 서버에서 로드하는 sideeffect composable.
 * 메타데이터와 boundary GeoJSON을 병렬로 로드한다.
 */
export const useDistrictSideeffect = () => {
    const store = useDistrictStore()

    const init = async () => {
        await Promise.all([
            store.ensureLoaded(),
            store.ensureGuBoundaryLoaded(),
            store.ensureDongBoundaryLoaded()
        ])
    }

    return { init }
}
