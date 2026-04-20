/**
 * 행정경계 레이어의 표시 토글 상태를 관리하는 store composable.
 * GeoJSON 데이터는 useDistrictStore에서 관리한다.
 */
export const useBoundaryStore = () => {
    /** 시군구 경계 표시 여부 */
    const isGuActive = useState('boundary.gu', () => false)
    /** 읍면동 경계 표시 여부 */
    const isDongActive = useState('boundary.dong', () => false)

    const toggleGu = () => {
        isGuActive.value = !isGuActive.value
    }

    const toggleDong = () => {
        isDongActive.value = !isDongActive.value
    }

    return { isGuActive, isDongActive, toggleGu, toggleDong }
}
