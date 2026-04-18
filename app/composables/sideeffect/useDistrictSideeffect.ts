import type { SeoulDistrictData } from '#shared/types/district'
import { useDistrictStore } from '~/composables/store/useDistrictStore'

/**
 * 서울 행정구역 데이터를 서버에서 로드하는 sideeffect composable.
 * 메타데이터와 boundary GeoJSON을 병렬로 로드한다.
 * store는 상태만 보유하고, $fetch는 이 sideeffect에서 수행한다.
 */
export const useDistrictSideeffect = () => {
    const store = useDistrictStore()

    /** 메타데이터가 미로드 상태면 서버에서 fetch한다. */
    const ensureLoaded = async () => {
        if (store.data.value) return
        try {
            store.data.value = await $fetch<SeoulDistrictData>('/api/district')
        } catch (e) {
            console.error('[useDistrictSideeffect] district data load failed', e)
        }
    }

    /** 시군구 boundary GeoJSON이 없으면 fetch하고 캐시한다. */
    const ensureGuBoundaryLoaded = async () => {
        if (store.guGeojson.value) return
        try {
            store.guGeojson.value = await $fetch('/api/boundary/seoul')
        } catch {
            store.guGeojson.value = null
        }
    }

    /** 법정동 boundary GeoJSON이 없으면 fetch하고 캐시한다. */
    const ensureDongBoundaryLoaded = async () => {
        if (store.dongGeojson.value) return
        try {
            store.dongGeojson.value = await $fetch('/api/boundary/seoul-dong')
        } catch {
            store.dongGeojson.value = null
        }
    }

    const init = async () => {
        await Promise.all([
            ensureLoaded(),
            ensureGuBoundaryLoaded(),
            ensureDongBoundaryLoaded()
        ])
    }

    return { init, ensureLoaded, ensureGuBoundaryLoaded, ensureDongBoundaryLoaded }
}
