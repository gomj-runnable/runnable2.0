/**
 * 서울시 행정경계 레이어의 표시 상태와 GeoJSON 캐시를 관리하는 store composable.
 * 시군구와 읍면동 레이어를 독립적으로 on/off할 수 있다.
 * GeoJSON은 한 번만 fetch하고 여러 sideeffect가 공유한다.
 */
export const useBoundaryStore = () => {
    /** 시군구 경계 표시 여부 */
    const isGuActive = useState('boundary.gu', () => false)
    /** 읍면동 경계 표시 여부 */
    const isDongActive = useState('boundary.dong', () => false)

    /** 캐시된 시군구 GeoJSON */
    const guGeojson = useState<unknown>('boundary.guGeojson', () => null)
    /** 캐시된 행정동 GeoJSON */
    const dongGeojson = useState<unknown>('boundary.dongGeojson', () => null)

    const toggleGu = () => {
        isGuActive.value = !isGuActive.value
    }

    const toggleDong = () => {
        isDongActive.value = !isDongActive.value
    }

    /** 시군구 GeoJSON이 없으면 fetch하고 캐시한다 */
    const ensureGuLoaded = async () => {
        if (guGeojson.value) return
        try {
            guGeojson.value = await $fetch('/api/boundary/seoul')
        } catch {
            guGeojson.value = null
        }
    }

    /** 행정동 GeoJSON이 없으면 fetch하고 캐시한다 */
    const ensureDongLoaded = async () => {
        if (dongGeojson.value) return
        try {
            dongGeojson.value = await $fetch('/api/boundary/seoul-dong')
        } catch {
            dongGeojson.value = null
        }
    }

    return {
        isGuActive, isDongActive, toggleGu, toggleDong,
        guGeojson, dongGeojson, ensureGuLoaded, ensureDongLoaded
    }
}
